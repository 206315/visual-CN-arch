import { useRef, useState, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Html, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

/* ==========================================================================
   根据 date/ 目录参考图片重建的精美斗拱 3D 模型
   参考：七铺作双抄双下昂斗拱（宋《营造法式》）
   特征：梯形斗口、弧形卷杀拱臂、斜昂嘴、圆椽排列、彩绘装饰
   ========================================================================== */

/* ========== 构件类型枚举 ========== */
type PartType = 'dou' | 'gong' | 'ang' | 'fang' | 'chuan' | 'pillar';

/* ========== 构件数据结构 ========== */
interface PartDef {
  name: string;
  type: PartType;
  color: string;
  paintColor?: string;    // 彩绘色（仅枋/拱边缘装饰）
  position: [number, number, number];
  rotation?: [number, number, number];
  params: Record<string, number>;  // 形态参数
  desc: string;
  layer: number;          // 爆炸分层索引
}

/* ========== 七铺作斗拱构件定义（17个构件） ========== */
const DOUGONG_PARTS: PartDef[] = [
  // ---- 第0层：柱头 ----
  {
    name: '柱头', type: 'pillar', color: '#6B3A2A',
    position: [0, -0.6, 0],
    params: { topW: 0.7, botW: 0.8, h: 0.6, d: 0.7 },
    desc: '檐柱柱头，斗拱的直接承载基础。柱头微收（侧脚），上刻卷草纹饰。',
    layer: 0,
  },
  // ---- 第1层：栌斗（大斗） ----
  {
    name: '栌斗（大斗）', type: 'dou', color: '#8B5E3C',
    position: [0, 0, 0],
    params: { topW: 1.0, botW: 0.72, h: 0.48, d: 1.0, slotW: 0.52, slotD: 0.16 },
    desc: '坐斗，方形，上大下小，四面斗耳微翘。顶面开十字卯口，承接第一跳华拱与泥道拱。',
    layer: 1,
  },
  // ---- 第2层：一跳华拱 + 泥道拱（十字交叉） ----
  {
    name: '华拱（一跳）', type: 'gong', color: '#9B6B45',
    position: [0, 0.48, 0],
    params: { span: 2.0, h: 0.26, w: 0.42, curve: 0.12 },
    desc: '第一跳出跳拱臂，沿面阔方向伸出。两端卷杀为弧形曲面，状如弯月，是斗拱受力的核心构件。',
    layer: 2,
  },
  {
    name: '泥道拱', type: 'gong', color: '#A57A50',
    position: [0, 0.48, 0],
    rotation: [0, Math.PI / 2, 0],
    params: { span: 1.8, h: 0.26, w: 0.42, curve: 0.10 },
    desc: '与华拱正交的纵向拱臂，沿进深方向。两端同样卷杀，与华拱十字相交形成稳定节点。',
    layer: 2,
  },
  // ---- 第3层：交互斗（4个散斗） ----
  {
    name: '交互斗（前左）', type: 'dou', color: '#A8754D',
    position: [-0.72, 0.74, -0.62],
    params: { topW: 0.38, botW: 0.28, h: 0.28, d: 0.38, slotW: 0.22, slotD: 0.10 },
    desc: '位于一跳拱臂交叉点外侧的小斗，承接上层拱件。斗耳精巧，如小方盒。',
    layer: 3,
  },
  {
    name: '交互斗（前右）', type: 'dou', color: '#A8754D',
    position: [0.72, 0.74, -0.62],
    params: { topW: 0.38, botW: 0.28, h: 0.28, d: 0.38, slotW: 0.22, slotD: 0.10 },
    desc: '位于一跳拱臂交叉点外侧的小斗，承接上层拱件。斗耳精巧，如小方盒。',
    layer: 3,
  },
  {
    name: '交互斗（后左）', type: 'dou', color: '#A8754D',
    position: [-0.72, 0.74, 0.62],
    params: { topW: 0.38, botW: 0.28, h: 0.28, d: 0.38, slotW: 0.22, slotD: 0.10 },
    desc: '位于一跳拱臂交叉点外侧的小斗，承接上层拱件。',
    layer: 3,
  },
  {
    name: '交互斗（后右）', type: 'dou', color: '#A8754D',
    position: [0.72, 0.74, 0.62],
    params: { topW: 0.38, botW: 0.28, h: 0.28, d: 0.38, slotW: 0.22, slotD: 0.10 },
    desc: '位于一跳拱臂交叉点外侧的小斗，承接上层拱件。',
    layer: 3,
  },
  // ---- 第4层：二跳华拱 + 瓜子拱 ----
  {
    name: '华拱（二跳）', type: 'gong', color: '#B08050',
    position: [0, 1.02, 0],
    params: { span: 2.8, h: 0.28, w: 0.44, curve: 0.15 },
    desc: '第二跳华拱，出挑更远。弧形卷杀更为舒展，线条优美如飞翼。参考图中可见层层递进的拱臂轮廓。',
    layer: 4,
  },
  {
    name: '瓜子拱', type: 'gong', color: '#B8874F',
    position: [0, 1.02, 0],
    rotation: [0, Math.PI / 2, 0],
    params: { span: 2.4, h: 0.26, w: 0.40, curve: 0.12 },
    desc: '二跳层的纵向短拱，形似瓜子，两端卷杀圆润。与二跳华拱十字交叉。',
    layer: 4,
  },
  // ---- 第5层：下昂 ----
  {
    name: '下昂（前）', type: 'ang', color: '#7A5230',
    position: [0, 1.30, -0.5],
    rotation: [-0.35, 0, 0],
    params: { length: 2.6, h: 0.22, w: 0.30, tipLen: 0.4 },
    desc: '斜向下倾的构件，昂头伸出檐外下垂，昂嘴琢作批竹状。利用杠杆原理挑起屋檐，是斗拱最精妙的力学设计。',
    layer: 5,
  },
  {
    name: '下昂（后）', type: 'ang', color: '#7A5230',
    position: [0, 1.30, 0.5],
    rotation: [0.35, 0, 0],
    params: { length: 2.6, h: 0.22, w: 0.30, tipLen: 0.4 },
    desc: '后侧下昂，与前昂对称布置，共同形成杠杆平衡体系。',
    layer: 5,
  },
  // ---- 第6层：齐心斗 + 散斗 ----
  {
    name: '齐心斗', type: 'dou', color: '#C49A5C',
    position: [0, 1.52, 0],
    params: { topW: 0.50, botW: 0.36, h: 0.30, d: 0.50, slotW: 0.28, slotD: 0.10 },
    desc: '最顶层正中的斗，承接耍头与承托枋，是斗拱的收顶构件。',
    layer: 6,
  },
  {
    name: '散斗（左）', type: 'dou', color: '#C49A5C',
    position: [-1.15, 1.52, 0],
    params: { topW: 0.36, botW: 0.26, h: 0.24, d: 0.36, slotW: 0.22, slotD: 0.08 },
    desc: '二跳拱臂端部的小斗，用于承接上方枋木。',
    layer: 6,
  },
  {
    name: '散斗（右）', type: 'dou', color: '#C49A5C',
    position: [1.15, 1.52, 0],
    params: { topW: 0.36, botW: 0.26, h: 0.24, d: 0.36, slotW: 0.22, slotD: 0.08 },
    desc: '二跳拱臂端部的小斗，用于承接上方枋木。',
    layer: 6,
  },
  // ---- 第7层：承托枋（彩绘） ----
  {
    name: '枋（承椽枋）', type: 'fang', color: '#B0855A', paintColor: '#2B6E5A',
    position: [0, 1.82, 0],
    params: { w: 3.6, h: 0.24, d: 0.72 },
    desc: '最顶部横向枋木，将荷载均匀分配至下方斗拱。表面施以旋子彩画，青绿为主，金线勾边，体现皇家规制。',
    layer: 7,
  },
  // ---- 第8层：椽条排列 ----
  {
    name: '椽条组', type: 'chuan', color: '#8C6840',
    position: [0, 2.10, 0],
    params: { radius: 0.06, length: 3.8, count: 14, spacing: 0.28 },
    desc: '圆形截面椽木，排列于枋上承托屋面。椽头端面可见年轮花纹，参考图中清晰可辨，是识别古建年代的依据之一。',
    layer: 8,
  },
];

/* ==========================================================================
   几何体生成工具函数
   ========================================================================== */

/**
 * 生成梯形斗几何体（上宽下窄 + 顶面卯口凹槽）
 */
function createDouGeometry(topW: number, botW: number, h: number, d: number, slotW: number, slotD: number): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  const hw = topW / 2;
  const hbw = botW / 2;
  /* 正面梯形轮廓 */
  shape.moveTo(-hbw, 0);
  shape.lineTo(-hw, h);
  /* 斗口凹槽 */
  shape.lineTo(-slotW / 2, h);
  shape.lineTo(-slotW / 2, h - slotD);
  shape.lineTo(slotW / 2, h - slotD);
  shape.lineTo(slotW / 2, h);
  shape.lineTo(hw, h);
  shape.lineTo(hbw, 0);
  shape.closePath();

  const extrudeSettings: THREE.ExtrudeGeometryOptions = {
    depth: d,
    bevelEnabled: true,
    bevelThickness: 0.015,
    bevelSize: 0.015,
    bevelSegments: 2,
  };
  const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  geo.translate(0, 0, -d / 2);
  geo.computeVertexNormals();
  return geo;
}

/**
 * 生成弧形卷杀拱几何体（两端向上弯曲的拱臂）
 */
function createGongGeometry(span: number, h: number, w: number, curve: number): THREE.BufferGeometry {
  const halfSpan = span / 2;
  const segments = 24;
  const shape = new THREE.Shape();
  /* 截面：矩形 + 底部倒角 */
  const hw = w / 2;
  const hh = h / 2;
  shape.moveTo(-hw, -hh);
  shape.lineTo(-hw, hh);
  shape.lineTo(hw, hh);
  shape.lineTo(hw, -hh);
  shape.closePath();

  /* 沿X轴的弧形路径（卷杀曲线） */
  const path = new THREE.CurvePath<THREE.Vector3>();
  const points: THREE.Vector3[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const x = (t - 0.5) * span;
    /* 两端上翘的弧线 */
    const normalizedDist = Math.abs(t - 0.5) * 2; // 0到1，中心到端部
    const y = curve * Math.pow(normalizedDist, 2.5);
    points.push(new THREE.Vector3(x, y, 0));
  }

  const curvePath = new THREE.CatmullRomCurve3(points);
  const extrudeSettings: THREE.ExtrudeGeometryOptions = {
    steps: segments,
    extrudePath: curvePath,
    bevelEnabled: false,
  };

  const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  geo.computeVertexNormals();
  return geo;
}

/**
 * 生成昂构件几何体（斜向+尖端昂嘴）
 */
function createAngGeometry(length: number, h: number, w: number, tipLen: number): THREE.BufferGeometry {
  const hw = w / 2;
  const hh = h / 2;
  const halfLen = length / 2;

  /* 侧面轮廓（带昂嘴尖端） */
  const shape = new THREE.Shape();
  shape.moveTo(-halfLen, -hh);
  shape.lineTo(-halfLen, hh);
  shape.lineTo(halfLen - tipLen, hh);
  /* 昂嘴：上缘斜削 */
  shape.quadraticCurveTo(halfLen - tipLen * 0.3, hh * 0.5, halfLen, -hh * 0.3);
  /* 昂嘴下缘回弯 */
  shape.quadraticCurveTo(halfLen - tipLen * 0.15, -hh * 0.8, halfLen - tipLen * 0.5, -hh);
  shape.lineTo(-halfLen, -hh);
  shape.closePath();

  const extrudeSettings: THREE.ExtrudeGeometryOptions = {
    depth: w,
    bevelEnabled: true,
    bevelThickness: 0.01,
    bevelSize: 0.01,
    bevelSegments: 1,
  };
  const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  geo.translate(0, 0, -hw);
  geo.computeVertexNormals();
  return geo;
}

/* ==========================================================================
   3D 构件渲染组件
   ========================================================================== */

function PartMesh({
  part,
  exploded,
  selected,
  onSelect,
}: {
  part: PartDef;
  exploded: boolean;
  selected: boolean;
  onSelect: () => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  /* 爆炸偏移 */
  const explodeOffset = useMemo(() => exploded ? part.layer * 0.65 : 0, [exploded, part.layer]);
  const targetY = part.position[1] + explodeOffset;

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, 0.07);
    }
  });

  /* 材质颜色计算 */
  const matColor = selected ? '#FFD700' : hovered ? '#E8C56D' : part.color;
  const emissive = selected ? '#FFD700' : hovered ? '#C5A55A' : '#000000';
  const emissiveIntensity = selected ? 0.25 : hovered ? 0.12 : 0;

  /* 根据类型创建几何体（带防御性 try-catch） */
  const geometry = useMemo(() => {
    const p = part.params;
    try {
      switch (part.type) {
        case 'dou':
          return createDouGeometry(p.topW, p.botW, p.h, p.d, p.slotW ?? 0, p.slotD ?? 0);
        case 'gong':
          return createGongGeometry(p.span, p.h, p.w, p.curve);
        case 'ang':
          return createAngGeometry(p.length, p.h, p.w, p.tipLen);
        case 'pillar':
          return createDouGeometry(p.topW, p.botW, p.h, p.d, 0, 0);
        default:
          return null;
      }
    } catch (e) {
      console.warn('[DouGong] geometry creation failed for', part.name, e);
      return null;
    }
  }, [part.type, part.params]);

  const geometryNode = useMemo(() => {
    const p = part.params;
    if (part.type === 'fang') return <boxGeometry args={[p.w, p.h, p.d]} />;
    if (part.type === 'chuan') return null;
    if (geometry) return <primitive object={geometry} attach="geometry" />;
    /* 回退：简单 box */
    return <boxGeometry args={[p.topW || p.span || p.length || 1, p.h || 0.3, p.d || p.w || 0.5]} />;
  }, [geometry, part.type, part.params]);

  /* 椽条组：多个圆柱体 */
  if (part.type === 'chuan') {
    const { radius, length, count, spacing } = part.params;
    const startZ = -((count - 1) * spacing) / 2;
    return (
      <group
        ref={groupRef}
        position={[part.position[0], part.position[1], part.position[2]]}
      >
        {Array.from({ length: count }).map((_, i) => (
          <mesh
            key={i}
            position={[0, 0, startZ + i * spacing]}
            rotation={[0, 0, Math.PI / 2]}
            onClick={(e) => { e.stopPropagation(); onSelect(); }}
            onPointerOver={() => setHovered(true)}
            onPointerOut={() => setHovered(false)}
          >
            <cylinderGeometry args={[radius, radius, length, 12]} />
            <meshStandardMaterial
              color={matColor}
              roughness={0.75}
              metalness={0.05}
              emissive={emissive}
              emissiveIntensity={emissiveIntensity}
            />
          </mesh>
        ))}
        {/* 椽头装饰圆盘（端面可见年轮花纹） */}
        {Array.from({ length: count }).map((_, i) => (
          <mesh
            key={`cap-${i}`}
            position={[length / 2 + 0.01, 0, startZ + i * spacing]}
            rotation={[0, 0, Math.PI / 2]}
          >
            <cylinderGeometry args={[radius * 1.3, radius * 1.3, 0.02, 12]} />
            <meshStandardMaterial color="#D4B87A" roughness={0.5} metalness={0.15} />
          </mesh>
        ))}
        {(selected || hovered) && (
          <Html position={[0, 0.3, 0]} center distanceFactor={8}>
            <div className="bg-imperial-deeper/90 text-imperial-gold px-3 py-1 rounded text-xs whitespace-nowrap border border-imperial-gold/30 backdrop-blur-sm">
              {part.name}
            </div>
          </Html>
        )}
      </group>
    );
  }

  return (
    <group
      ref={groupRef}
      position={[part.position[0], part.position[1], part.position[2]]}
      rotation={part.rotation || [0, 0, 0]}
    >
      <mesh
        onClick={(e) => { e.stopPropagation(); onSelect(); }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        {geometryNode}
        <meshStandardMaterial
          color={matColor}
          roughness={0.72}
          metalness={0.06}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* 枋的彩绘装饰条 */}
      {part.type === 'fang' && part.paintColor && (
        <>
          <mesh position={[0, part.params.h / 2 + 0.005, 0]}>
            <boxGeometry args={[part.params.w * 0.96, 0.02, part.params.d * 0.6]} />
            <meshStandardMaterial color={part.paintColor} roughness={0.4} metalness={0.15} />
          </mesh>
          {/* 金线边框 */}
          <mesh position={[0, part.params.h / 2 + 0.012, 0]}>
            <boxGeometry args={[part.params.w * 0.98, 0.008, part.params.d * 0.95]} />
            <meshStandardMaterial color="#D4A843" roughness={0.3} metalness={0.4} />
          </mesh>
        </>
      )}

      {(selected || hovered) && (
        <Html position={[0, 0.4, 0]} center distanceFactor={8}>
          <div className="bg-imperial-deeper/90 text-imperial-gold px-3 py-1 rounded text-xs whitespace-nowrap border border-imperial-gold/30 backdrop-blur-sm">
            {part.name}
          </div>
        </Html>
      )}
    </group>
  );
}

/* ========== 3D 场景 ========== */
function DouGongScene({ exploded, selectedIdx, onSelect }: {
  exploded: boolean;
  selectedIdx: number | null;
  onSelect: (i: number | null) => void;
}) {
  return (
    <>
      {/* 三点布光 */}
      <ambientLight intensity={0.35} />
      <directionalLight position={[6, 10, 6]} intensity={1.2} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
      <directionalLight position={[-4, 6, -4]} intensity={0.4} />
      <directionalLight position={[0, -2, 5]} intensity={0.15} />

      {DOUGONG_PARTS.map((part, i) => (
        <PartMesh
          key={i}
          part={part}
          exploded={exploded}
          selected={selectedIdx === i}
          onSelect={() => onSelect(selectedIdx === i ? null : i)}
        />
      ))}

      <ContactShadows position={[0, -0.95, 0]} opacity={0.5} scale={12} blur={2.5} far={4} />
      <OrbitControls
        enablePan
        enableZoom
        minDistance={3}
        maxDistance={18}
        autoRotate={!exploded}
        autoRotateSpeed={0.4}
        maxPolarAngle={Math.PI * 0.85}
      />
      {/* 补光：模拟 Environment 效果（不依赖 CDN） */}
      <hemisphereLight args={['#C5A55A', '#3A2A1A', 0.5]} />
      <pointLight position={[-5, 5, -5]} intensity={0.3} color="#FFEEDD" />
    </>
  );
}

/* ========== 应力热力图 ========== */
function StressIndicator({ selectedIdx }: { selectedIdx: number | null }) {
  const stressData = useMemo(() => [
    100, 95, 82, 80, 62, 62, 62, 62, 48, 46, 40, 40, 30, 28, 28, 22, 15
  ], []);

  return (
    <div className="space-y-1">
      <p className="text-xs text-imperial-gold/60 mb-2 tracking-wider">应力分布（由底至顶递减）</p>
      {DOUGONG_PARTS.map((part, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className={`text-[10px] w-20 truncate ${selectedIdx === i ? 'text-imperial-gold font-bold' : 'text-gray-500'}`}>
            {part.name}
          </span>
          <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${stressData[i]}%`,
                background: stressData[i] > 70
                  ? 'linear-gradient(90deg, #DC3545, #FF6B35)'
                  : stressData[i] > 40
                    ? 'linear-gradient(90deg, #C5A55A, #E8A835)'
                    : 'linear-gradient(90deg, #2E7D5F, #4CAF50)',
              }}
            />
          </div>
          <span className="text-[10px] text-gray-600 w-7 text-right">{stressData[i]}%</span>
        </div>
      ))}
    </div>
  );
}

/* ========== 页面主组件 ========== */
function DouGongPage() {
  const [exploded, setExploded] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const selectedPart = selectedIdx !== null ? DOUGONG_PARTS[selectedIdx] : null;

  return (
    <div className="min-h-screen ink-bg">
      {/* 页面标题 */}
      <div className="text-center pt-8 pb-4 px-4">
        <h1 className="text-3xl md:text-4xl font-bold text-imperial-gold tracking-wider">
          斗拱智慧拆解
        </h1>
        <p className="text-gray-500 text-sm mt-2 tracking-widest">
          七铺作双抄双下昂 · 点击构件查看详情 · 拖拽旋转视角
        </p>
        <div className="chinese-divider max-w-xs mx-auto mt-4" />
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 3D 视口 */}
          <div className="lg:col-span-2 h-[500px] md:h-[600px] gold-border rounded-lg overflow-hidden bg-imperial-deeper/50">
            <Canvas
              camera={{ position: [3.5, 3, 5], fov: 42 }}
              shadows
            >
              <Suspense fallback={null}>
                <DouGongScene
                  exploded={exploded}
                  selectedIdx={selectedIdx}
                  onSelect={setSelectedIdx}
                />
              </Suspense>
            </Canvas>
          </div>

          {/* 右侧面板 */}
          <div className="space-y-4">
            {/* 交互控制 */}
            <div className="gold-border rounded-lg p-4 bg-imperial-deeper/50">
              <h3 className="text-imperial-gold text-sm font-bold tracking-wider mb-3">交互控制</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setExploded(!exploded)}
                  className={`px-4 py-2 rounded text-xs tracking-wider transition-all ${
                    exploded
                      ? 'bg-imperial-gold text-imperial-dark font-bold'
                      : 'border border-imperial-gold/40 text-imperial-gold hover:bg-imperial-gold/10'
                  }`}
                >
                  {exploded ? '🔧 复原组装' : '💥 爆炸拆解'}
                </button>
                <button
                  onClick={() => setSelectedIdx(null)}
                  className="px-4 py-2 rounded text-xs tracking-wider border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition-all"
                >
                  取消选中
                </button>
              </div>
              <p className="text-[10px] text-gray-600 mt-2">
                共 {DOUGONG_PARTS.length} 个构件 · {new Set(DOUGONG_PARTS.map(p => p.layer)).size} 个层级
              </p>
            </div>

            {/* 构件详情 */}
            <div className="gold-border rounded-lg p-4 bg-imperial-deeper/50 min-h-[160px]">
              <h3 className="text-imperial-gold text-sm font-bold tracking-wider mb-3">构件详情</h3>
              {selectedPart ? (
                <div className="animate-fade-in">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-3 h-3 rounded-sm" style={{ background: selectedPart.color }} />
                    <p className="text-imperial-gold text-base font-bold">{selectedPart.name}</p>
                    <span className="text-[10px] text-gray-600 bg-gray-800 px-1.5 py-0.5 rounded">
                      {selectedPart.type}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm leading-relaxed">{selectedPart.desc}</p>
                  <div className="mt-3 text-[10px] text-gray-600">
                    层级 {selectedPart.layer} · 位置 ({selectedPart.position.map(v => v.toFixed(2)).join(', ')})
                  </div>
                </div>
              ) : (
                <p className="text-gray-600 text-sm">点击3D模型中的构件查看详细信息</p>
              )}
            </div>

            {/* 应力分布 */}
            <div className="gold-border rounded-lg p-4 bg-imperial-deeper/50">
              <h3 className="text-imperial-gold text-sm font-bold tracking-wider mb-3">力学分析</h3>
              <StressIndicator selectedIdx={selectedIdx} />
            </div>

            {/* 营造法式知识 */}
            <div className="gold-border rounded-lg p-4 bg-imperial-deeper/50">
              <h3 className="text-imperial-gold text-sm font-bold tracking-wider mb-3">📖 营造法式</h3>
              <p className="text-gray-400 text-xs leading-relaxed">
                七铺作斗拱是宋代《营造法式》中最高等级的斗拱形制，由栌斗、华拱、泥道拱、瓜子拱、
                令拱、下昂、散斗等多种构件组成。"铺作"指斗拱的层数，七铺作即出跳三层，是最复杂的官式做法。
                其精妙在于：拱臂两端"卷杀"为弧形曲面，下昂利用杠杆原理挑起沉重屋檐，实现了力与美的完美统一。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DouGongPage;
