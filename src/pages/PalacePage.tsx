import { useRef, useState, useMemo, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Html, useGLTF, Center } from '@react-three/drei';
import * as THREE from 'three';

/* ==========================================================================
   故宫角楼精确测绘数据（基于张鎛1941-1944年测绘图）
   参考：《北京中轴线建筑实测图典》、故宫博物院东南角楼实测图纸
   ========================================================================== */

const PALACE_SPECS = {
  /* 整体控制 */
  totalHeight: 27.5,        // 总高度（米）
  platformHeight: 1.6,      // 台基高度（米）
  
  /* 柱网系统（20根檐柱，减柱造） */
  columnCount: 20,          // 檐柱数量
  columnHeight: 3.95,       // 檐柱高度（米）
  columnDiameter: 0.48,     // 柱径（米）
  columnLean: 0.12,         // 侧脚（柱顶内倾，米）
  
  /* 平面布局（十字曲尺形） */
  mainPavilionSize: 8.73,   // 中央方亭边长（米）
  largeAnnexDepth: 3.98,    // 大抱厦进深（米）
  largeAnnexWidth: 5.59,    // 大抱厦面阔（米）
  smallAnnexDepth: 1.60,    // 小抱厦进深（米）
  
  /* 斗拱系统（220攒） */
  dougong: {
    lower: 72,              // 下层腰檐（七十二地煞）
    middle: 60,             // 中层（六十甲子）
    upper: 28,              // 上层（二十八星宿）
    indoor: 7,              // 室内品字科
  },
  
  /* 屋顶系统 */
  ridgeCount: 76,           // 总脊数
  wingCornerCount: 28,      // 翼角数
  valleyCount: 16,          // 窝角数
  
  /* 宝顶 */
  finialHeight: 1.9,        // 宝顶高度（米）
  finialDiameter: 1.1,      // 宝顶底部直径（米）
  
  /* 吻兽装饰（254件） */
  ornaments: {
    mainKiss: 10,           // 正吻
    cornerKiss: 32,         // 合角吻（16对）
    hangingBeast: 20,       // 垂兽
    diagonalBeast: 28,      // 戗兽
    immortal: 40,           // 仙人
    dragon: 40,             // 龙
    phoenix: 28,            // 凤
    lion: 28,               // 狮
  },
};

/* ========== 结构层级定义（用于交互） ========== */
interface LayerDef {
  id: string;
  name: string;
  desc: string;
  yRange: [number, number]; // Y轴范围，用于点击检测
}

const PALACE_LAYERS: LayerDef[] = [
  {
    id: 'platform',
    name: '台基与栏杆',
    desc: '汉白玉须弥座台基，高1.6米，环绕望柱栏板。台基采用三层叠涩做法，彰显皇家威严。',
    yRange: [0, 1.6],
  },
  {
    id: 'columns',
    name: '檐柱柱网',
    desc: '20根檐柱，高3.95米，直径0.48米。采用"减柱造"，无金柱，柱顶向内倾斜12厘米（侧脚），增强稳定性。',
    yRange: [1.6, 5.55],
  },
  {
    id: 'lower-dougong',
    name: '下层斗拱（72攒）',
    desc: '腰檐层斗拱，共72攒，对应七十二地煞星。斗拱层层出跳，承托下层屋檐重量。',
    yRange: [5.55, 6.2],
  },
  {
    id: 'lower-roof',
    name: '下层屋檐',
    desc: '歇山顶形制，黄琉璃瓦覆顶。四面出檐，翼角起翘，窝角内凹，形成复杂的屋面曲线。',
    yRange: [6.2, 9.5],
  },
  {
    id: 'middle-dougong',
    name: '中层斗拱（60攒）',
    desc: '二层重檐斗拱，共60攒，对应六十甲子。斗拱更为精巧，七踩三昂式样。',
    yRange: [9.5, 10.8],
  },
  {
    id: 'middle-roof',
    name: '中层屋檐',
    desc: '第二层重檐歇山顶，琉璃瓦金碧辉煌。屋脊装饰正吻、垂兽、戗兽等吻兽构件。',
    yRange: [10.8, 15.2],
  },
  {
    id: 'upper-dougong',
    name: '上层斗拱（28攒）',
    desc: '顶层斗拱，共28攒，对应二十八星宿。斗拱最为精致，承托十字脊屋顶。',
    yRange: [15.2, 16.5],
  },
  {
    id: 'upper-roof',
    name: '十字脊屋顶',
    desc: '最顶层十字脊歇山顶，76条脊交织，28个翼角飞扬。这是"九梁十八柱七十二脊"的核心体现。',
    yRange: [16.5, 24.0],
  },
  {
    id: 'finial',
    name: '鎏金宝顶',
    desc: '铜制鎏金宝顶，高1.9米，底部直径1.1米，用金约1.1公斤。象征皇权至高无上。',
    yRange: [24.0, 27.5],
  },
];

function getLayerIndexFromPalaceHeight(height: number) {
  return PALACE_LAYERS.findIndex((layer) => height >= layer.yRange[0] && height <= layer.yRange[1]);
}

/* ========== 故宫角楼统计数据 ========== */
const STATS = [
  { label: '斗拱', value: '220', unit: '攒' },
  { label: '脊', value: '76', unit: '条' },
  { label: '吻兽', value: '254', unit: '件' },
  { label: '历史', value: '604', unit: '年' },
];

/* ========== 颜色常量（参照da文件夹实物照片校正） ========== */
const C = {
  white:     '#E8E2D6', // 汉白玉台基（略偏暖灰）
  whitePure: '#F0EBE0', // 望柱柱头
  red:       '#B22222', // 朱红墙体
  redDark:   '#8B1A1A', // 门窗深红
  redGable:  '#A52828', // 博风板山面（暗红，实物偏暗）
  roof:      '#C87820', // 琉璃瓦（橙黄色，实物偏橙非纯金）
  roofRidge: '#D49028', // 屋脊装饰（略亮于瓦面）
  goldFinial:'#E8B020', // 鎏金宝顶
  bracket:   '#2A3A28', // 斗拱主色（深墨绿/深棕，实物非常暗）
  bracketAlt:'#384838', // 斗拱副色（稍亮的深绿）
  bracketDk: '#1E2E1C', // 斗拱最暗面
  soffit:    '#2A3228', // 檐下望板（深色）
  column:    '#7A1818', // 柱子（暗红）
  wallGray:  '#5A5450', // 城墙灰砖
  wallDark:  '#484440', // 城墙暗面
  ground:    '#3A3530', // 地面
};

/* ========== 单个斗拱构件（多层出跳，深绿棕色，参照实物照片） ========== */
function Dougong({ pos, rot = 0, s = 1, hl = false }: {
  pos: [number, number, number]; rot?: number; s?: number; hl?: boolean;
}) {
  const c1 = hl ? '#FFD700' : C.bracket;
  const c2 = hl ? '#FFD700' : C.bracketAlt;
  const c3 = hl ? '#FFD700' : C.bracketDk;
  const em = hl ? 0.2 : 0;
  return (
    <group position={pos} rotation={[0, rot, 0]} scale={s}>
      {/* 坐斗 */}
      <mesh><boxGeometry args={[0.30, 0.12, 0.30]} />
        <meshStandardMaterial color={c1} roughness={0.85} emissive={c1} emissiveIntensity={em} /></mesh>
      {/* 栌斗上方小斗 */}
      <mesh position={[0, 0.09, 0]}><boxGeometry args={[0.22, 0.06, 0.22]} />
        <meshStandardMaterial color={c2} roughness={0.82} emissive={c2} emissiveIntensity={em} /></mesh>
      {/* 第一跳华拱（横向） */}
      <mesh position={[0, 0.14, 0]}><boxGeometry args={[0.44, 0.07, 0.10]} />
        <meshStandardMaterial color={c3} roughness={0.85} emissive={c3} emissiveIntensity={em} /></mesh>
      {/* 泥道拱（纵向） */}
      <mesh position={[0, 0.14, 0]}><boxGeometry args={[0.10, 0.07, 0.44]} />
        <meshStandardMaterial color={c3} roughness={0.85} emissive={c3} emissiveIntensity={em} /></mesh>
      {/* 第二跳 */}
      <mesh position={[0, 0.20, 0]}><boxGeometry args={[0.52, 0.06, 0.12]} />
        <meshStandardMaterial color={c1} roughness={0.82} emissive={c1} emissiveIntensity={em} /></mesh>
      <mesh position={[0, 0.20, 0]}><boxGeometry args={[0.12, 0.06, 0.52]} />
        <meshStandardMaterial color={c1} roughness={0.82} emissive={c1} emissiveIntensity={em} /></mesh>
      {/* 第三跳 */}
      <mesh position={[0, 0.25, 0]}><boxGeometry args={[0.58, 0.05, 0.14]} />
        <meshStandardMaterial color={c2} roughness={0.8} emissive={c2} emissiveIntensity={em} /></mesh>
      {/* 散斗（四角） */}
      {[-0.20, 0.20].map(dx => [-0.20, 0.20].map(dz => (
        <mesh key={`sd-${dx}-${dz}`} position={[dx, 0.30, dz]}>
          <boxGeometry args={[0.08, 0.06, 0.08]} />
          <meshStandardMaterial color={c3} roughness={0.85} emissive={c3} emissiveIntensity={em} />
        </mesh>
      )))}
      {/* 耍头（伸出的昂嘴） */}
      <mesh position={[0.25, 0.28, 0]}><boxGeometry args={[0.14, 0.04, 0.06]} />
        <meshStandardMaterial color={c2} roughness={0.8} emissive={c2} emissiveIntensity={em} /></mesh>
    </group>
  );
}

/* ========== 歇山顶屋面组件（一个方向） ========== */
/* 包含：主檐面（金色）、博风板山面（红色三角）、翼角起翘、屋脊、走兽 */
function XieshanRoof({ y, mainW, mainD, eaveOut, ridgeH, gableH, hl = false }: {
  y: number; mainW: number; mainD: number; eaveOut: number;
  ridgeH: number; gableH: number; hl?: boolean;
}) {
  const roofClr = hl ? '#FFD700' : C.roof;
  const roofEm = hl ? 0.12 : 0;
  const totalW = mainW + eaveOut * 2;
  const totalD = mainD + eaveOut * 2;

  return (
    <group position={[0, y, 0]}>
      {/* 四面主檐面（倾斜板） + 檐下望板 */}
      {[0, 1, 2, 3].map(face => {
        const rot = face * Math.PI / 2;
        const isXFace = face % 2 === 0;
        const w = isXFace ? totalW : totalD;
        const d = isXFace ? totalD / 2 : totalW / 2;
        return (
          <group key={`roof-face-${face}`} rotation={[0, rot, 0]}>
            {/* 瓦面（橙黄色琉璃瓦） */}
            <mesh position={[0, ridgeH * 0.3, d * 0.5]} rotation={[0.38, 0, 0]}>
              <boxGeometry args={[w * 1.05, 0.12, d * 0.95]} />
              <meshStandardMaterial color={roofClr} roughness={0.32} metalness={0.48}
                emissive={roofClr} emissiveIntensity={roofEm} side={THREE.DoubleSide} />
            </mesh>
            {/* 檐下望板（深色，模拟椽子和望板的暗色底面） */}
            <mesh position={[0, ridgeH * 0.22, d * 0.5]} rotation={[0.38, 0, 0]}>
              <boxGeometry args={[w * 1.0, 0.04, d * 0.90]} />
              <meshStandardMaterial color={C.soffit} roughness={0.9} side={THREE.DoubleSide} />
            </mesh>
            {/* 瓦楞（沿屋面方向的纵向条纹） */}
            {Array.from({ length: Math.floor(w / 0.8) }).map((_, ri) => (
              <mesh key={`tile-ridge-${ri}`}
                position={[(ri - Math.floor(w / 0.8) / 2 + 0.5) * 0.75, ridgeH * 0.32, d * 0.5]}
                rotation={[0.38, 0, 0]}>
                <boxGeometry args={[0.06, 0.04, d * 0.88]} />
                <meshStandardMaterial color={roofClr} roughness={0.4} metalness={0.4} />
              </mesh>
            ))}
          </group>
        );
      })}

      {/* 红色博风板山面（四个三角形） */}
      {[0, 90, 180, 270].map(angle => {
        const rad = angle * Math.PI / 180;
        const dist = (angle % 180 === 0 ? mainD : mainW) / 2 + eaveOut * 0.7;
        return (
          <mesh key={`gable-${angle}`}
            position={[Math.sin(rad) * dist, ridgeH * 0.45, Math.cos(rad) * dist]}
            rotation={[0, rad, 0]}>
            <mesh rotation={[0, 0, 0]}>
              <coneGeometry args={[(angle % 180 === 0 ? mainW : mainD) * 0.42, gableH, 3]} />
              <meshStandardMaterial color={hl ? '#FFD700' : C.redGable} roughness={0.6}
                emissive={hl ? '#FFD700' : C.redGable} emissiveIntensity={hl ? roofEm : 0.05} />
            </mesh>
          </mesh>
        );
      })}

      {/* 正脊（顶部横脊） */}
      {[0, 90].map(angle => (
        <mesh key={`ridge-${angle}`} position={[0, ridgeH, 0]} rotation={[0, angle * Math.PI / 180, 0]}>
          <boxGeometry args={[mainW * 0.65, 0.22, 0.18]} />
          <meshStandardMaterial color={C.roofRidge} roughness={0.35} metalness={0.55} />
        </mesh>
      ))}

      {/* 垂脊（从正脊端部到翼角） */}
      {[45, 135, 225, 315].map(angle => {
        const rad = angle * Math.PI / 180;
        const len = totalW * 0.45;
        return (
          <mesh key={`hang-ridge-${angle}`}
            position={[Math.cos(rad) * len * 0.45, ridgeH * 0.55, Math.sin(rad) * len * 0.45]}
            rotation={[0, rad, -0.35]}>
            <boxGeometry args={[len, 0.15, 0.12]} />
            <meshStandardMaterial color={C.roofRidge} roughness={0.35} metalness={0.5} />
          </mesh>
        );
      })}

      {/* 翼角起翘（8个角向外上扬） */}
      {[45, 135, 225, 315].map(angle => {
        const rad = angle * Math.PI / 180;
        const dist = totalW * 0.52;
        return (
          <group key={`wing-${angle}`}>
            {/* 翼角主体 */}
            <mesh position={[Math.cos(rad) * dist, -ridgeH * 0.15, Math.sin(rad) * dist]}
              rotation={[0.12, rad + Math.PI / 4, -0.28]}>
              <boxGeometry args={[2.2, 0.1, 0.7]} />
              <meshStandardMaterial color={roofClr} roughness={0.35} metalness={0.45} />
            </mesh>
            {/* 翼角尖端翘起 */}
            <mesh position={[Math.cos(rad) * (dist + 1.0), -ridgeH * 0.05, Math.sin(rad) * (dist + 1.0)]}
              rotation={[0.2, rad, -0.5]}>
              <boxGeometry args={[0.8, 0.06, 0.3]} />
              <meshStandardMaterial color={C.roofRidge} roughness={0.3} metalness={0.5} />
            </mesh>
            {/* 戗兽 */}
            <mesh position={[Math.cos(rad) * (dist + 1.3), ridgeH * 0.0, Math.sin(rad) * (dist + 1.3)]}>
              <boxGeometry args={[0.18, 0.30, 0.12]} />
              <meshStandardMaterial color={C.roofRidge} roughness={0.4} metalness={0.5} />
            </mesh>
          </group>
        );
      })}

      {/* 正吻（正脊端部，4座） */}
      {[0, 90, 180, 270].map(angle => {
        const rad = angle * Math.PI / 180;
        const dist = mainW * 0.32;
        return (
          <group key={`zhengwen-${angle}`} position={[Math.sin(rad) * dist, ridgeH, Math.cos(rad) * dist]}>
            <mesh><boxGeometry args={[0.28, 0.55, 0.20]} />
              <meshStandardMaterial color={C.roofRidge} roughness={0.35} metalness={0.55} /></mesh>
            <mesh position={[0, 0.38, 0]} rotation={[0.3, 0, 0]}>
              <boxGeometry args={[0.10, 0.35, 0.08]} />
              <meshStandardMaterial color={C.roofRidge} roughness={0.3} metalness={0.6} /></mesh>
          </group>
        );
      })}

      {/* 走兽（每条垂脊5只） */}
      {[45, 135, 225, 315].map(angle => {
        const rad = angle * Math.PI / 180;
        return Array.from({ length: 5 }).map((_, bi) => {
          const d = totalW * 0.18 + bi * totalW * 0.065;
          const bY = ridgeH * (0.75 - bi * 0.15);
          return (
            <mesh key={`beast-${angle}-${bi}`}
              position={[Math.cos(rad) * d, bY, Math.sin(rad) * d]}>
              <boxGeometry args={[0.08, 0.14, 0.06]} />
              <meshStandardMaterial color={C.roofRidge} roughness={0.4} metalness={0.5} />
            </mesh>
          );
        });
      })}
    </group>
  );
}

/* ========== 十字形台基Shape ========== */
function makeCrossShape(ctr: number, aw: number, ad: number): THREE.Shape {
  const h = ctr / 2, hw = aw / 2;
  const s = new THREE.Shape();
  s.moveTo(h, hw); s.lineTo(h + ad, hw); s.lineTo(h + ad, -hw); s.lineTo(h, -hw);
  s.lineTo(h, -h); s.lineTo(hw, -h); s.lineTo(hw, -h - ad); s.lineTo(-hw, -h - ad);
  s.lineTo(-hw, -h); s.lineTo(-h, -h); s.lineTo(-h, -hw); s.lineTo(-h - ad, -hw);
  s.lineTo(-h - ad, hw); s.lineTo(-h, hw); s.lineTo(-h, h); s.lineTo(-hw, h);
  s.lineTo(-hw, h + ad); s.lineTo(hw, h + ad); s.lineTo(hw, h); s.lineTo(h, h);
  s.closePath();
  return s;
}

/* ========== 故宫角楼3D模型组件（精细版） ========== */
function PalaceModel({ selectedIdx, onSelect }: {
  selectedIdx: number | null;
  onSelect: (i: number | null) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const scale = 0.1;
  const S = PALACE_SPECS;

  const handleClick = (layerId: string) => {
    const idx = PALACE_LAYERS.findIndex(l => l.id === layerId);
    onSelect(selectedIdx === idx ? null : idx);
  };
  const hl = (layerId: string) => {
    const idx = PALACE_LAYERS.findIndex(l => l.id === layerId);
    return selectedIdx === idx;
  };
  const hlMat = <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={0.25} />;

  /* 十字形台基形状 */
  const crossShape = useMemo(() => makeCrossShape(S.mainPavilionSize, S.largeAnnexWidth, S.largeAnnexDepth), []);

  /* 柱位：沿十字形外轮廓排列 */
  const colPos = useMemo(() => {
    const pts: [number, number][] = [];
    const h = S.mainPavilionSize / 2, aw = S.largeAnnexWidth / 2, ad = S.largeAnnexDepth;
    /* 中央方亭每边 */
    for (const v of [-h, -aw, 0, aw, h]) {
      pts.push([v, h]); pts.push([v, -h]);
      pts.push([h, v]); pts.push([-h, v]);
    }
    /* 四面抱厦外沿 */
    pts.push([h + ad, aw]); pts.push([h + ad, -aw]);
    pts.push([-h - ad, aw]); pts.push([-h - ad, -aw]);
    pts.push([aw, h + ad]); pts.push([-aw, h + ad]);
    pts.push([aw, -h - ad]); pts.push([-aw, -h - ad]);
    /* 去重 */
    const u: [number, number][] = [];
    for (const p of pts) {
      if (!u.some(q => Math.abs(q[0] - p[0]) < 0.1 && Math.abs(q[1] - p[1]) < 0.1)) u.push(p);
    }
    return u;
  }, []);

  /* 墙面定义（中央方亭四面 + 四面抱厦） */
  const walls = useMemo(() => {
    const h = S.mainPavilionSize / 2, aw = S.largeAnnexWidth / 2, ad = S.largeAnnexDepth;
    return [
      /* 中央方亭四面 */
      { cx: 0, cz: h, rot: 0, w: S.mainPavilionSize },
      { cx: 0, cz: -h, rot: 0, w: S.mainPavilionSize },
      { cx: h, cz: 0, rot: Math.PI / 2, w: S.mainPavilionSize },
      { cx: -h, cz: 0, rot: Math.PI / 2, w: S.mainPavilionSize },
      /* 四面抱厦（较窄） */
      { cx: h + ad, cz: 0, rot: Math.PI / 2, w: S.largeAnnexWidth },
      { cx: -h - ad, cz: 0, rot: Math.PI / 2, w: S.largeAnnexWidth },
      { cx: 0, cz: h + ad, rot: 0, w: S.largeAnnexWidth },
      { cx: 0, cz: -h - ad, rot: 0, w: S.largeAnnexWidth },
      /* 抱厦侧墙 */
      { cx: h + ad / 2, cz: aw, rot: 0, w: ad },
      { cx: h + ad / 2, cz: -aw, rot: 0, w: ad },
      { cx: -h - ad / 2, cz: aw, rot: 0, w: ad },
      { cx: -h - ad / 2, cz: -aw, rot: 0, w: ad },
      { cx: aw, cz: h + ad / 2, rot: Math.PI / 2, w: ad },
      { cx: -aw, cz: h + ad / 2, rot: Math.PI / 2, w: ad },
      { cx: aw, cz: -h - ad / 2, rot: Math.PI / 2, w: ad },
      { cx: -aw, cz: -h - ad / 2, rot: Math.PI / 2, w: ad },
    ];
  }, []);

  return (
    <group ref={groupRef} scale={scale}>

      {/* ====================== 1. 白色须弥座台基 ====================== */}
      <group onClick={() => handleClick('platform')}>
        {/* 台基底层（带倒角） */}
        <mesh position={[0, 0.25, 0]} receiveShadow>
          <extrudeGeometry args={[crossShape, { depth: 0.5, bevelEnabled: true, bevelThickness: 0.12, bevelSize: 0.25, bevelSegments: 2 }]} />
          {hl('platform') ? hlMat : <meshStandardMaterial color="#D8D5CC" roughness={0.75} />}
        </mesh>
        {/* 台基上层 */}
        <mesh position={[0, 0.75, 0]} receiveShadow>
          <extrudeGeometry args={[crossShape, { depth: 0.85, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.12, bevelSegments: 1 }]} />
          {hl('platform') ? hlMat : <meshStandardMaterial color={C.white} roughness={0.65} />}
        </mesh>

        {/* 台基线脚 */}
        {[0.5, 0.75, 1.55].map((yy, ii) => (
          <mesh key={`mold-${ii}`} position={[0, yy, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <shapeGeometry args={[crossShape]} />
            <meshStandardMaterial color="#CCC8BC" roughness={0.8} side={THREE.DoubleSide} />
          </mesh>
        ))}

        {/* 四面台阶 */}
        {[0, 90, 180, 270].map(angle => {
          const rad = angle * Math.PI / 180;
          const dist = S.mainPavilionSize / 2 + S.largeAnnexDepth + 0.6;
          return (
            <group key={`stair-${angle}`} position={[Math.sin(rad) * dist, 0, Math.cos(rad) * dist]} rotation={[0, rad, 0]}>
              {[0, 1, 2, 3].map(st => (
                <mesh key={st} position={[0, st * 0.4 + 0.2, st * 0.32 - 0.6]}>
                  <boxGeometry args={[S.largeAnnexWidth * 0.55, 0.4, 0.32]} />
                  {hl('platform') ? hlMat : <meshStandardMaterial color={C.white} roughness={0.7} />}
                </mesh>
              ))}
            </group>
          );
        })}

        {/* 白色栏杆望柱（台基顶部边缘） */}
        {colPos.map(([x, z], i) => (
          <group key={`rail-${i}`} position={[x, S.platformHeight, z]}>
            {/* 望柱 */}
            <mesh position={[0, 0.38, 0]}>
              <boxGeometry args={[0.10, 0.76, 0.10]} />
              <meshStandardMaterial color={C.whitePure} roughness={0.55} />
            </mesh>
            {/* 莲瓣柱头 */}
            <mesh position={[0, 0.80, 0]}>
              <sphereGeometry args={[0.08, 8, 6]} />
              <meshStandardMaterial color={C.whitePure} roughness={0.5} />
            </mesh>
          </group>
        ))}
        {/* 栏板（连接望柱之间） */}
        {colPos.map(([x, z], i) => {
          const next = colPos[(i + 1) % colPos.length];
          const dx = next[0] - x, dz = next[1] - z;
          const d = Math.sqrt(dx * dx + dz * dz);
          if (d > S.mainPavilionSize * 0.7) return null;
          return (
            <mesh key={`railp-${i}`}
              position={[(x + next[0]) / 2, S.platformHeight + 0.35, (z + next[1]) / 2]}
              rotation={[0, Math.atan2(dx, dz), 0]}>
              <boxGeometry args={[0.06, 0.50, d * 0.85]} />
              <meshStandardMaterial color={C.whitePure} roughness={0.6} />
            </mesh>
          );
        })}
      </group>

      {/* ====================== 2. 朱红墙体 + 柱网 ====================== */}
      <group onClick={() => handleClick('columns')}>
        {/* 檐柱（朱红色） */}
        {colPos.map(([x, z], i) => (
          <group key={`col-${i}`} position={[x, S.platformHeight, z]}>
            {/* 柱础 */}
            <mesh position={[0, 0.08, 0]}>
              <cylinderGeometry args={[S.columnDiameter * 0.65, S.columnDiameter * 0.75, 0.16, 8]} />
              <meshStandardMaterial color="#C0BCB0" roughness={0.7} />
            </mesh>
            {/* 柱身 */}
            <mesh position={[0, S.columnHeight / 2 + 0.16, 0]} castShadow>
              <cylinderGeometry args={[S.columnDiameter / 2 * 0.9, S.columnDiameter / 2, S.columnHeight, 12]} />
              {hl('columns') ? hlMat : <meshStandardMaterial color={C.column} roughness={0.8} />}
            </mesh>
          </group>
        ))}

        {/* 额枋（柱顶横梁） */}
        {colPos.map(([x, z], i) => {
          const next = colPos[(i + 1) % colPos.length];
          const dx = next[0] - x, dz = next[1] - z;
          const d = Math.sqrt(dx * dx + dz * dz);
          if (d > S.mainPavilionSize * 0.7) return null;
          return (
            <mesh key={`beam-${i}`}
              position={[(x + next[0]) / 2, S.platformHeight + S.columnHeight + 0.08, (z + next[1]) / 2]}
              rotation={[0, Math.atan2(dx, dz), 0]}>
              <boxGeometry args={[0.18, 0.20, d]} />
              {hl('columns') ? hlMat : <meshStandardMaterial color={C.redDark} roughness={0.82} />}
            </mesh>
          );
        })}

        {/* 朱红墙面 + 格扇门窗 */}
        {walls.map((w, i) => (
          <group key={`wall-${i}`} position={[w.cx, S.platformHeight, w.cz]} rotation={[0, w.rot, 0]}>
            {/* 墙体 */}
            <mesh position={[0, S.columnHeight / 2 + 0.16, 0]}>
              <boxGeometry args={[w.w * 0.92, S.columnHeight * 0.88, 0.10]} />
              {hl('columns') ? hlMat : <meshStandardMaterial color={C.red} roughness={0.75} />}
            </mesh>
            {/* 中央门洞（深色） */}
            <mesh position={[0, S.columnHeight * 0.48 + 0.16, 0.06]}>
              <boxGeometry args={[w.w * 0.22, S.columnHeight * 0.58, 0.02]} />
              <meshStandardMaterial color={C.redDark} roughness={0.85} />
            </mesh>
            {/* 两侧窗格 */}
            {[-1, 1].map(side => (
              <group key={`lat-${side}`} position={[side * w.w * 0.32, S.columnHeight * 0.58 + 0.16, 0.06]}>
                {/* 窗框 */}
                <mesh><boxGeometry args={[w.w * 0.22, S.columnHeight * 0.40, 0.015]} />
                  <meshStandardMaterial color={C.redDark} roughness={0.85} /></mesh>
                {/* 横棂 */}
                {Array.from({ length: 5 }).map((_, li) => (
                  <mesh key={`wh-${li}`} position={[0, (li - 2) * S.columnHeight * 0.07, 0.01]}>
                    <boxGeometry args={[w.w * 0.20, 0.02, 0.01]} />
                    <meshStandardMaterial color="#7A1515" roughness={0.8} />
                  </mesh>
                ))}
                {/* 竖棂 */}
                {Array.from({ length: 4 }).map((_, li) => (
                  <mesh key={`wv-${li}`} position={[(li - 1.5) * w.w * 0.05, 0, 0.01]}>
                    <boxGeometry args={[0.02, S.columnHeight * 0.38, 0.01]} />
                    <meshStandardMaterial color="#7A1515" roughness={0.8} />
                  </mesh>
                ))}
              </group>
            ))}
          </group>
        ))}
      </group>

      {/* ====================== 3. 下层斗拱（72攒，蓝绿色） ====================== */}
      <group onClick={() => handleClick('lower-dougong')}>
        {Array.from({ length: S.dougong.lower }).map((_, i) => {
          const angle = (i / S.dougong.lower) * Math.PI * 2;
          const r = S.mainPavilionSize / 2 + S.largeAnnexDepth * 0.55;
          return <Dougong key={`dg1-${i}`}
            pos={[Math.cos(angle) * r, S.platformHeight + S.columnHeight + 0.22, Math.sin(angle) * r]}
            rot={angle + Math.PI} s={0.82} hl={hl('lower-dougong')} />;
        })}
        {/* 檐枋（斗拱上方承托板） */}
        <mesh position={[0, S.platformHeight + S.columnHeight + 0.60, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <shapeGeometry args={[crossShape]} />
          <meshStandardMaterial color={C.bracket} roughness={0.7} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* ====================== 4. 下层屋顶 ====================== */}
      <group onClick={() => handleClick('lower-roof')}>
        <XieshanRoof y={6.5} mainW={S.mainPavilionSize + S.largeAnnexDepth}
          mainD={S.mainPavilionSize + S.largeAnnexDepth}
          eaveOut={2.8} ridgeH={3.2} gableH={2.0} hl={hl('lower-roof')} />
      </group>

      {/* ====================== 5. 中层墙体+斗拱（60攒） ====================== */}
      <group onClick={() => handleClick('middle-dougong')}>
        {/* 中层红色墙体（下层屋顶与中层屋顶之间的可见结构） */}
        {/* 中层方体墙面 */}
        {[0, 90, 180, 270].map(angle => {
          const rad = angle * Math.PI / 180;
          const wallR = S.mainPavilionSize / 2.5;
          return (
            <group key={`mid-wall-${angle}`}>
              <mesh position={[Math.sin(rad) * wallR, 9.6, Math.cos(rad) * wallR]}
                rotation={[0, rad, 0]}>
                <boxGeometry args={[S.mainPavilionSize * 0.55, 1.8, 0.08]} />
                {hl('middle-dougong') ? hlMat : <meshStandardMaterial color={C.red} roughness={0.75} />}
              </mesh>
            </group>
          );
        })}
        {/* 中层柱子（8根，方形布局） */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => {
          const rad = angle * Math.PI / 180;
          const r = S.mainPavilionSize / 2.5;
          return (
            <mesh key={`mid-col-${angle}`}
              position={[Math.cos(rad) * r, 9.6, Math.sin(rad) * r]} castShadow>
              <cylinderGeometry args={[0.15, 0.16, 1.8, 8]} />
              {hl('middle-dougong') ? hlMat : <meshStandardMaterial color={C.column} roughness={0.82} />}
            </mesh>
          );
        })}
        {/* 中层斗拱 */}
        {Array.from({ length: S.dougong.middle }).map((_, i) => {
          const angle = (i / S.dougong.middle) * Math.PI * 2;
          const r = S.mainPavilionSize / 2.4;
          return <Dougong key={`dg2-${i}`}
            pos={[Math.cos(angle) * r, 10.6, Math.sin(angle) * r]}
            rot={angle + Math.PI} s={0.68} hl={hl('middle-dougong')} />;
        })}
        {/* 中层檐枋 */}
        <mesh position={[0, 10.95, 0]}>
          <cylinderGeometry args={[S.mainPavilionSize / 2.2, S.mainPavilionSize / 2.0, 0.15, 16]} />
          <meshStandardMaterial color={C.bracket} roughness={0.7} />
        </mesh>
      </group>

      {/* ====================== 6. 中层屋顶 ====================== */}
      <group onClick={() => handleClick('middle-roof')}>
        <XieshanRoof y={11.3} mainW={S.mainPavilionSize * 0.75}
          mainD={S.mainPavilionSize * 0.75}
          eaveOut={2.2} ridgeH={3.0} gableH={1.6} hl={hl('middle-roof')} />
      </group>

      {/* ====================== 7. 上层墙体+斗拱（28攒） ====================== */}
      <group onClick={() => handleClick('upper-dougong')}>
        {/* 上层红色墙体（中层屋顶与上层屋顶之间的可见结构） */}
        {[0, 90, 180, 270].map(angle => {
          const rad = angle * Math.PI / 180;
          const wallR = S.mainPavilionSize / 4.0;
          return (
            <mesh key={`up-wall-${angle}`}
              position={[Math.sin(rad) * wallR, 14.8, Math.cos(rad) * wallR]}
              rotation={[0, rad, 0]}>
              <boxGeometry args={[S.mainPavilionSize * 0.35, 1.5, 0.06]} />
              {hl('upper-dougong') ? hlMat : <meshStandardMaterial color={C.red} roughness={0.75} />}
            </mesh>
          );
        })}
        {/* 上层柱子（4根） */}
        {[0, 90, 180, 270].map(angle => {
          const rad = angle * Math.PI / 180;
          const r = S.mainPavilionSize / 3.8;
          return (
            <mesh key={`up-col-${angle}`}
              position={[Math.cos(rad) * r, 14.8, Math.sin(rad) * r]} castShadow>
              <cylinderGeometry args={[0.12, 0.13, 1.5, 8]} />
              {hl('upper-dougong') ? hlMat : <meshStandardMaterial color={C.column} roughness={0.82} />}
            </mesh>
          );
        })}
        {/* 上层斗拱 */}
        {Array.from({ length: S.dougong.upper }).map((_, i) => {
          const angle = (i / S.dougong.upper) * Math.PI * 2;
          const r = S.mainPavilionSize / 3.6;
          return <Dougong key={`dg3-${i}`}
            pos={[Math.cos(angle) * r, 15.6, Math.sin(angle) * r]}
            rot={angle + Math.PI} s={0.55} hl={hl('upper-dougong')} />;
        })}
        {/* 上层檐枋 */}
        <mesh position={[0, 15.95, 0]}>
          <cylinderGeometry args={[S.mainPavilionSize / 3.4, S.mainPavilionSize / 3.2, 0.12, 12]} />
          <meshStandardMaterial color={C.bracket} roughness={0.7} />
        </mesh>
      </group>

      {/* ====================== 8. 上层十字脊屋顶 ====================== */}
      <group onClick={() => handleClick('upper-roof')}>
        <XieshanRoof y={16.3} mainW={S.mainPavilionSize * 0.48}
          mainD={S.mainPavilionSize * 0.48}
          eaveOut={1.6} ridgeH={4.5} gableH={2.2} hl={hl('upper-roof')} />
      </group>

      {/* ====================== 9. 鎏金宝顶 ====================== */}
      <group onClick={() => handleClick('finial')}>
        {/* 覆莲座 */}
        <mesh position={[0, 21.5, 0]}>
          <cylinderGeometry args={[S.finialDiameter * 0.55, S.finialDiameter * 0.7, 0.35, 16]} />
          {hl('finial') ? hlMat : <meshStandardMaterial color={C.goldFinial} roughness={0.25} metalness={0.65}
            emissive={C.goldFinial} emissiveIntensity={0.12} />}
        </mesh>
        {/* 须弥座 */}
        <mesh position={[0, 21.9, 0]}>
          <cylinderGeometry args={[S.finialDiameter * 0.3, S.finialDiameter * 0.5, 0.45, 16]} />
          <meshStandardMaterial color="#D4A028" roughness={0.3} metalness={0.6} />
        </mesh>
        {/* 宝瓶 */}
        <mesh position={[0, 22.4, 0]}>
          <cylinderGeometry args={[0.18, 0.28, 0.55, 12]} />
          <meshStandardMaterial color={C.goldFinial} roughness={0.2} metalness={0.7}
            emissive={C.goldFinial} emissiveIntensity={0.1} />
        </mesh>
        {/* 宝珠 */}
        <mesh position={[0, 23.0, 0]} castShadow>
          <sphereGeometry args={[0.32, 16, 16]} />
          {hl('finial') ? <meshStandardMaterial color="#FFD700" roughness={0.12} metalness={0.85}
            emissive="#FFD700" emissiveIntensity={0.4} /> :
            <meshStandardMaterial color={C.goldFinial} roughness={0.18} metalness={0.78}
              emissive={C.goldFinial} emissiveIntensity={0.18} />}
        </mesh>
        {/* 尖端 */}
        <mesh position={[0, 23.6, 0]}>
          <coneGeometry args={[0.06, 0.55, 8]} />
          <meshStandardMaterial color="#E8B020" roughness={0.15} metalness={0.8}
            emissive="#E8B020" emissiveIntensity={0.2} />
        </mesh>
      </group>

      {/* ====================== 10. 城墙基座（厚实灰砖） ====================== */}
      {/* 城墙主体 */}
      <mesh position={[0, -2.0, 0]} receiveShadow>
        <boxGeometry args={[19, 4, 19]} />
        <meshStandardMaterial color={C.wallGray} roughness={0.92} />
      </mesh>
      {/* 城墙顶面 */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[19, 19]} />
        <meshStandardMaterial color={C.wallDark} roughness={0.88} />
      </mesh>
      {/* 城墙砖缝纹理（水平线） */}
      {Array.from({ length: 8 }).map((_, i) => (
        <group key={`brick-h-${i}`}>
          {[0, 1, 2, 3].map(side => {
            const y = -3.5 + i * 0.5;
            const pos: [number, number, number] = [
              side === 1 ? 9.51 : side === 3 ? -9.51 : 0,
              y,
              side === 0 ? 9.51 : side === 2 ? -9.51 : 0,
            ];
            return (
              <mesh key={`bh-${i}-${side}`} position={pos} rotation={[0, side % 2 === 0 ? 0 : Math.PI / 2, 0]}>
                <boxGeometry args={[19, 0.02, 0.02]} />
                <meshStandardMaterial color={C.wallDark} roughness={0.95} />
              </mesh>
            );
          })}
        </group>
      ))}
      {/* 垛口（城墙顶部雉堞） */}
      {Array.from({ length: 32 }).map((_, i) => {
        const side = Math.floor(i / 8);
        const idx = i % 8;
        const offset = (idx - 3.5) * 2.2;
        const pos: [number, number, number] = [
          side === 1 ? 9.5 : side === 3 ? -9.5 : offset,
          0.6,
          side === 0 ? 9.5 : side === 2 ? -9.5 : offset,
        ];
        return (
          <mesh key={`bt-${i}`} position={pos}>
            <boxGeometry args={[1.0, 0.9, 0.45]} />
            <meshStandardMaterial color={C.wallGray} roughness={0.9} />
          </mesh>
        );
      })}
      {/* 城墙角部加厚 */}
      {[[-9.5, -9.5], [9.5, -9.5], [-9.5, 9.5], [9.5, 9.5]].map(([x, z], i) => (
        <mesh key={`corner-${i}`} position={[x, -2.0, z]}>
          <boxGeometry args={[1.2, 4.2, 1.2]} />
          <meshStandardMaterial color={C.wallDark} roughness={0.9} />
        </mesh>
      ))}

      {/* 地面 */}
      <mesh position={[0, -4.1, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color={C.ground} roughness={1} />
      </mesh>
      {/* 护城河 */}
      <mesh position={[0, -4.0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[18, 28, 32]} />
        <meshStandardMaterial color="#1A2A3A" roughness={0.2} metalness={0.5} transparent opacity={0.55} />
      </mesh>
    </group>
  );
}

/* ========== GLB 模型路径（由 scripts/generate_palace_glb.py 生成） ========== */
const GLB_MODEL_PATH = new URL('../../3dc0d3f1-d0b7-4c69-820b-b6971dc10baf.glb', import.meta.url).href;

/* ========== GLB 模型加载组件（TRELLIS 生成的3D模型） ========== */
function PalaceGLBModel({
  selectedIdx,
  onError,
}: {
  selectedIdx: number | null;
  onError: () => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF(GLB_MODEL_PATH, true, true, (loader) => {
    loader.manager.onError = () => onError();
  });

  useEffect(() => {
    if (!scene) {
      onError();
      return;
    }
    /* 自动计算包围盒并居中缩放 */
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const targetSize = 2.35;
    const scale = targetSize / maxDim;
    scene.scale.setScalar(scale);
    scene.position.set(-center.x * scale, -center.y * scale + 0.65, -center.z * scale);
    scene.userData.sourceMinY = box.min.y;
    scene.userData.sourceHeight = size.y;
    scene.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) {
        return;
      }
      const material = child.material;
      const materials = Array.isArray(material) ? material : [material];
      child.userData.baseEmissive = materials.map((mat) => (mat instanceof THREE.MeshStandardMaterial ? mat.emissive.clone() : null));
      child.userData.baseEmissiveIntensity = materials.map((mat) => (mat instanceof THREE.MeshStandardMaterial ? mat.emissiveIntensity : 0));
    });
  }, [scene, onError]);

  useEffect(() => {
    if (!scene || scene.userData.sourceHeight === undefined || scene.userData.sourceMinY === undefined) {
      return;
    }
    scene.updateMatrixWorld(true);
    scene.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) {
        return;
      }
      child.geometry.computeBoundingBox();
      if (!child.geometry.boundingBox) {
        return;
      }
      const center = child.geometry.boundingBox.getCenter(new THREE.Vector3());
      const localCenter = child.localToWorld(center).clone();
      const sourceCenter = scene.worldToLocal(localCenter);
      const ratio = THREE.MathUtils.clamp(
        (sourceCenter.y - scene.userData.sourceMinY) / scene.userData.sourceHeight,
        0,
        1
      );
      const layerIdx = getLayerIndexFromPalaceHeight(ratio * PALACE_SPECS.totalHeight);
      const material = child.material;
      const materials = Array.isArray(material) ? material : [material];
      materials.forEach((mat, index) => {
        if (!(mat instanceof THREE.MeshStandardMaterial)) {
          return;
        }
        const baseEmissive = child.userData.baseEmissive?.[index] as THREE.Color | null;
        const baseIntensity = child.userData.baseEmissiveIntensity?.[index] as number | undefined;
        if (selectedIdx !== null && layerIdx === selectedIdx) {
          mat.emissive.set('#FFD700');
          mat.emissiveIntensity = 0.35;
        } else {
          if (baseEmissive) {
            mat.emissive.copy(baseEmissive);
          }
          mat.emissiveIntensity = baseIntensity ?? 0;
        }
      });
    });
  }, [scene, selectedIdx]);

  /* 缓慢自转展示 */
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.15;
    }
  });

  return (
    <group ref={groupRef}>
      <primitive object={scene} />
    </group>
  );
}

/* ========== 3D 场景 ========== */
function PalaceScene({ selectedIdx, onSelect, viewMode }: {
  selectedIdx: number | null;
  onSelect: (i: number | null) => void;
  viewMode: 'geometry' | 'glb';
}) {
  const [glbFailed, setGlbFailed] = useState(false);
  const showGLB = viewMode === 'glb' && !glbFailed;

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 15, 10]} intensity={1.3} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
      <directionalLight position={[-8, 10, -8]} intensity={0.4} />
      <directionalLight position={[0, 5, 15]} intensity={0.3} />

      {showGLB ? (
        <Suspense fallback={
          <Html center>
            <div className="text-imperial-gold text-sm animate-pulse">加载 3D 模型中...</div>
          </Html>
        }>
          <PalaceGLBModel selectedIdx={selectedIdx} onError={() => setGlbFailed(true)} />
        </Suspense>
      ) : (
        <PalaceModel selectedIdx={selectedIdx} onSelect={onSelect} />
      )}

      <ContactShadows position={[0, -0.12, 0]} opacity={0.5} scale={25} blur={2.5} far={10} />
      <OrbitControls
        enablePan
        enableZoom
        minDistance={showGLB ? 3 : 8}
        maxDistance={showGLB ? 15 : 35}
        autoRotate={!showGLB}
        autoRotateSpeed={0.25}
        maxPolarAngle={Math.PI / 2.1}
      />
      {/* 补光 */}
      <hemisphereLight args={['#FFA040', '#2A3A4A', 0.4]} />
      <pointLight position={[-8, 6, -6]} intensity={0.3} color="#FFEEDD" />
    </>
  );
}

/* ========== 皇宫游览页面主组件 ========== */
function PalacePage() {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'geometry' | 'glb'>('geometry');
  const [glbAvailable, setGlbAvailable] = useState<boolean | null>(null);
  const selectedLayer = selectedIdx !== null ? PALACE_LAYERS[selectedIdx] : null;

  /* 检测 GLB 模型是否存在 */
  useEffect(() => {
    fetch(GLB_MODEL_PATH, { method: 'HEAD' })
      .then(res => setGlbAvailable(res.ok))
      .catch(() => setGlbAvailable(false));
  }, []);

  return (
    <div className="min-h-screen ink-bg">
      {/* 页面标题 */}
      <div className="text-center pt-8 pb-4 px-4">
        <h1 className="text-3xl md:text-4xl font-bold text-imperial-gold tracking-wider">
          故宫角楼 · 皇家建筑巅峰
        </h1>
        <p className="text-gray-500 text-sm mt-2 tracking-widest">
          九梁十八柱七十二脊 · 点击结构层查看详情
        </p>
        <div className="chinese-divider max-w-xs mx-auto mt-4" />
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-12">
        {/* 统计数据栏 */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {STATS.map((s) => (
            <div key={s.label} className="gold-border rounded-lg p-3 bg-imperial-deeper/50 text-center">
              <p className="text-2xl md:text-3xl font-black text-imperial-gold">{s.value}</p>
              <p className="text-[10px] text-gray-500 tracking-wider mt-1">{s.label} · {s.unit}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 3D 视口 */}
          <div className="lg:col-span-2 h-[500px] md:h-[600px] gold-border rounded-lg overflow-hidden bg-imperial-deeper/50 relative">
            <div className="absolute top-3 left-3 z-10 flex gap-2">
              <button
                onClick={() => setViewMode('geometry')}
                className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${
                  viewMode === 'geometry'
                    ? 'bg-imperial-gold/20 text-imperial-gold border border-imperial-gold/50'
                    : 'bg-black/40 text-gray-400 border border-gray-700 hover:text-gray-200'
                }`}
              >
                结构分析
              </button>
              <button
                onClick={() => setViewMode('glb')}
                disabled={!glbAvailable}
                className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${
                  viewMode === 'glb'
                    ? 'bg-imperial-gold/20 text-imperial-gold border border-imperial-gold/50'
                    : glbAvailable
                      ? 'bg-black/40 text-gray-400 border border-gray-700 hover:text-gray-200'
                      : 'bg-black/20 text-gray-600 border border-gray-800 cursor-not-allowed'
                }`}
                title={glbAvailable ? '3dc0d3f1-d0b7-4c69-820b-b6971dc10baf 建模视图' : '模型资源未就绪'}
              >
                新建模视图 {glbAvailable === false && '(未就绪)'}
              </button>
            </div>
            <Canvas camera={{ position: [6, 5, 8], fov: 45 }} shadows>
              <Suspense fallback={null}>
                <PalaceScene selectedIdx={selectedIdx} onSelect={setSelectedIdx} viewMode={viewMode} />
              </Suspense>
            </Canvas>
          </div>

          {/* 右侧信息面板 */}
          <div className="space-y-4">
            {/* 结构图例 */}
            <div className="gold-border rounded-lg p-4 bg-imperial-deeper/50">
              <h3 className="text-imperial-gold text-sm font-bold tracking-wider mb-3">🏛️ 结构图例</h3>
              <div className="space-y-1">
                {PALACE_LAYERS.map((layer, i) => {
                  const colors = [C.white, C.red, C.bracket, C.roof, C.bracketAlt, C.roof, C.bracketDk, C.roof, C.goldFinial];
                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedIdx(selectedIdx === i ? null : i)}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-all text-left ${
                        selectedIdx === i
                          ? 'bg-imperial-gold/15 text-imperial-gold'
                          : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                      }`}
                    >
                      <span
                        className="w-3 h-3 rounded-sm shrink-0"
                        style={{ background: colors[i] }}
                      />
                      <span className="truncate">{layer.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 层级详情 */}
            <div className="gold-border rounded-lg p-4 bg-imperial-deeper/50 min-h-[120px]">
              <h3 className="text-imperial-gold text-sm font-bold tracking-wider mb-3">📋 层级详情</h3>
              {selectedLayer ? (
                <div className="animate-fade-in">
                  <p className="text-imperial-gold text-base font-bold mb-2">{selectedLayer.name}</p>
                  <p className="text-gray-400 text-sm leading-relaxed">{selectedLayer.desc}</p>
                </div>
              ) : (
                <p className="text-gray-600 text-sm">点击3D模型或左侧图例查看各层详情</p>
              )}
            </div>

            {/* 知识卡片 */}
            <div className="gold-border rounded-lg p-4 bg-imperial-deeper/50">
              <h3 className="text-imperial-gold text-sm font-bold tracking-wider mb-3">📖 建筑档案</h3>
              <div className="space-y-2 text-xs text-gray-400 leading-relaxed">
                <p>
                  故宫角楼建于明永乐十八年（1420年），位于紫禁城四角城墙之上，
                  是中国古代建筑中最精美的杰作之一。
                </p>
                <p>
                  其平面呈十字形，三层屋檐，共有<span className="text-imperial-gold">28个翼角</span>，
                  <span className="text-imperial-gold">72条脊</span>，造型极为复杂精巧。
                  民间传说鲁班曾化身老翁指点工匠，以蝈蝈笼为灵感建造。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PalacePage;
