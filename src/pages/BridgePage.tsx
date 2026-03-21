import { useRef, useState, useMemo, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows } from '@react-three/drei';
import ReactEChartsCore from 'echarts-for-react';
import * as THREE from 'three';
import PointCloudBridge from '../components/PointCloudBridge';

/* ==========================================================================
   赵州桥精确测绘数据（基于现代工程测量）
   参考：《赵州桥工程图纸》、《中国古代桥梁》
   ========================================================================== */

const BRIDGE_SPECS = {
  /* 整体控制 */
  totalLength: 50.82,      // 总长度（米）
  totalWidth: 9.6,         // 总宽度（米）
  totalHeight: 8.7,        // 总高度（米）
  
  /* 主拱圈 */
  mainSpan: 37.02,         // 净跨径（米）
  mainRise: 7.23,          // 矢高（米）
  archThickness: 1.03,     // 拱券厚度（米）
  archWidth: 9.0,          // 拱券宽度（米）
  archRadius: 27.7,        // 圆弧拱半径（米，悬链线拟合）
  
  /* 敞肩小拱（4个） */
  smallArch: [
    { span: 3.8, rise: 1.63, offsetX: -14.5, offsetY: 5.8 },  // 左外侧
    { span: 2.85, rise: 1.13, offsetX: -10.2, offsetY: 6.5 }, // 左内侧
    { span: 2.85, rise: 1.13, offsetX: 10.2, offsetY: 6.5 },  // 右内侧
    { span: 3.8, rise: 1.63, offsetX: 14.5, offsetY: 5.8 },   // 右外侧
  ],
  
  /* 桥面与栏杆 */
  deckHeight: 8.7,         // 桥面标高（米）
  railingHeight: 0.8,      // 栏杆高度（米）
  
  /* 桥台 */
  abutmentLength: 5.0,     // 桥台长度（米）
  abutmentWidth: 10.0,     // 桥台宽度（米）
  abutmentDepth: 1.8,      // 桥台埋深（米）
  
  /* 纵向分券 */
  vaultCount: 28,          // 28道独立拱券
};

const BRIDGE_INFO = {
  name: '赵州桥（安济桥）',
  builder: '李春',
  dynasty: '隋代（约605年）',
  span: '37.02米',
  rise: '7.23米',
  ratio: '约1:5.12（矢跨比极小，世界首创）',
  feature: '敞肩拱——主拱两端各有两个小拱，既减轻桥身重量，又利于排洪，还增添美观。',
};

/* ========== 视图模式 ========== */
type ViewMode = 'solid' | 'pointcloud' | 'wireframe';

/* ========== 伪随机石材色差生成器（参考点云重建中的逐点RGB差异） ========== */
function stoneColor(seed: number): string {
  /* 基于种子的确定性哈希，产生青灰石材的微小色差 */
  const h = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  const variation = (h - Math.floor(h)) * 0.12 - 0.06; // ±6% 色差
  const base = 0.72 + variation; // 基础亮度 ~0.66-0.78
  const r = Math.round(Math.min(255, Math.max(0, base * 255 * 1.02)));
  const g = Math.round(Math.min(255, Math.max(0, base * 255 * 1.00)));
  const b = Math.round(Math.min(255, Math.max(0, base * 255 * 0.94)));
  return `rgb(${r},${g},${b})`;
}

/* ========== 几何工具函数 ========== */

/**
 * 生成悬链线/圆弧拱曲线（采用圆弧拟合，半径27.7m）
 */
function createCatenaryArchCurve(span: number, rise: number, radius: number, segments: number): THREE.Vector3[] {
  const pts: THREE.Vector3[] = [];
  
  /* 圆心位置计算 */
  const centerY = radius - rise;
  
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const x = (t - 0.5) * span;
    
    /* 圆弧方程：x^2 + (y - centerY)^2 = radius^2 */
    const distFromCenter = Math.sqrt(radius * radius - x * x);
    const y = distFromCenter - centerY;
    
    pts.push(new THREE.Vector3(x, y, 0));
  }
  
  return pts;
}

/**
 * 生成小拱圆弧曲线
 */
function createSmallArchCurve(span: number, rise: number, segments: number): THREE.Vector3[] {
  const pts: THREE.Vector3[] = [];
  const halfSpan = span / 2;
  
  /* 简化为圆弧 */
  const radius = (rise * rise + halfSpan * halfSpan) / (2 * rise);
  const centerY = radius - rise;
  
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const x = (t - 0.5) * span;
    const distFromCenter = Math.sqrt(Math.max(0, radius * radius - x * x));
    const y = distFromCenter - centerY;
    pts.push(new THREE.Vector3(x, y, 0));
  }
  
  return pts;
}

/**
 * 生成拱形截面 Shape（外弧 + 内弧闭合）
 * 参考三角化重建中对曲面的精确拟合思路（find_camera.py 中的 tri_method）
 */
function createArchShape(
  span: number, rise: number, thickness: number,
  radius: number | null, segments: number, deformation: number
): THREE.Shape {
  const shape = new THREE.Shape();

  const outerCurve = radius
    ? createCatenaryArchCurve(span, rise - deformation, radius, segments)
    : createSmallArchCurve(span, rise - deformation, segments);
  const innerCurve = radius
    ? createCatenaryArchCurve(span, rise - thickness - deformation, radius, segments)
    : createSmallArchCurve(span, rise - thickness - deformation, segments);

  outerCurve.forEach((p, i) => (i === 0 ? shape.moveTo(p.x, p.y) : shape.lineTo(p.x, p.y)));
  for (let i = innerCurve.length - 1; i >= 0; i--) shape.lineTo(innerCurve[i].x, innerCurve[i].y);
  shape.closePath();
  return shape;
}

/* ========== 赵州桥 3D 模型组件（增强版） ========== */
function BridgeModel({ 
  load, 
  forcePosition, 
  onPositionClick,
  wireframe,
}: { 
  load: number; 
  forcePosition: number; 
  onPositionClick: (pos: number) => void;
  wireframe: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  
  /* 缩放比例：1:10（真实尺寸太大，缩小便于观察） */
  const scale = 0.1;
  const S = BRIDGE_SPECS;
  
  /* 根据荷载计算微小变形（夸大10倍可视化） */
  const deformation = useMemo(() => load * 0.0015, [load]);
  
  /* 桥面着力点位置（11个点，从左到右：-1到1） */
  const forcePoints = useMemo(() => 
    Array.from({ length: 11 }, (_, i) => (i / 10) * 2 - 1),
  []);
  
  /* 主拱曲线（高精度，120段用于个体拱石） */
  const mainArchCurve = useMemo(() => {
    return createCatenaryArchCurve(S.mainSpan, S.mainRise - deformation, S.archRadius, 120);
  }, [deformation]);

  /* 主拱截面形状 */
  const mainArchShape = useMemo(() => {
    return createArchShape(S.mainSpan, S.mainRise, S.archThickness, S.archRadius, 120, deformation);
  }, [deformation]);

  /* ========== 个体拱石几何（28道纵向分券，每道由多块拱石组成） ========== */
  /* 参考 SfM 重建中通过三角化恢复每块石材的独立几何（tri_method） */
  const voussoirBlocks = useMemo(() => {
    const blocks: Array<{ position: [number, number, number]; rotation: number; width: number; height: number; depth: number; color: string }> = [];
    const vaultWidth = S.archWidth / S.vaultCount;
    const stoneCountPerVault = 18; // 每道券的径向分块数

    for (let v = 0; v < S.vaultCount; v++) {
      const zPos = (v / S.vaultCount - 0.5) * S.archWidth + vaultWidth / 2;
      for (let s = 0; s < stoneCountPerVault; s++) {
        const t = s / stoneCountPerVault;
        const idx = Math.floor(t * (mainArchCurve.length - 1));
        const nextIdx = Math.min(idx + Math.floor(mainArchCurve.length / stoneCountPerVault), mainArchCurve.length - 1);
        const p0 = mainArchCurve[idx];
        const p1 = mainArchCurve[nextIdx];
        const mx = (p0.x + p1.x) / 2;
        const my = (p0.y + p1.y) / 2;
        const angle = Math.atan2(p1.y - p0.y, p1.x - p0.x);
        const blockLen = p0.distanceTo(p1);

        blocks.push({
          position: [mx, my + S.archThickness / 2, zPos],
          rotation: angle,
          width: blockLen * 0.96,  // 留2%缝隙（砂浆缝）
          height: S.archThickness * 0.98,
          depth: vaultWidth * 0.94,
          color: stoneColor(v * stoneCountPerVault + s),
        });
      }
    }
    return blocks;
  }, [mainArchCurve]);
  
  /* ========== 腹墙/侧面填充几何（主拱上方、小拱之间的实体墙） ========== */
  /* 参考 ROI.py 中检测桥面结构线的思路——提取主拱与桥面之间的实心区域 */
  const spandrelWalls = useMemo(() => {
    const walls: Array<{ shape: THREE.Shape; zPos: number }> = [];
    const wallThickness = 0.3; // 腹墙厚度
    const facePositions = [-S.archWidth / 2 + wallThickness / 2, S.archWidth / 2 - wallThickness / 2];

    for (const zPos of facePositions) {
      const shape = new THREE.Shape();
      /* 上边界：桥面底 */
      const deckBottom = S.deckHeight - 0.6 - deformation;
      /* 沿主拱外弧上方，到桥面底之间填充实体，但在小拱位置留空 */
      const segments = 80;
      const archPts: { x: number; y: number }[] = [];
      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const x = (t - 0.5) * S.mainSpan;
        const centerY = S.archRadius - (S.mainRise - deformation);
        const dist = Math.sqrt(Math.max(0, S.archRadius * S.archRadius - x * x));
        const archY = dist - centerY + S.archThickness;
        archPts.push({ x, y: Math.max(archY, 0) });
      }

      /* 构建外轮廓：底部沿拱面，顶部到桥面 */
      shape.moveTo(archPts[0].x, archPts[0].y);
      for (let i = 1; i < archPts.length; i++) {
        shape.lineTo(archPts[i].x, archPts[i].y);
      }
      shape.lineTo(archPts[archPts.length - 1].x, deckBottom);
      shape.lineTo(archPts[0].x, deckBottom);
      shape.closePath();

      /* 挖去4个小拱洞口 */
      for (const arch of S.smallArch) {
        const holeCurve = createSmallArchCurve(arch.span, arch.rise, 24);
        const hole = new THREE.Path();
        holeCurve.forEach((p, i) => {
          const px = p.x + arch.offsetX;
          const py = p.y + arch.offsetY;
          if (i === 0) hole.moveTo(px, py);
          else hole.lineTo(px, py);
        });
        /* 底边闭合 */
        hole.lineTo(arch.offsetX + arch.span / 2, arch.offsetY);
        hole.lineTo(arch.offsetX - arch.span / 2, arch.offsetY);
        hole.closePath();
        shape.holes.push(hole);
      }

      walls.push({ shape, zPos });
    }
    return walls;
  }, [deformation]);

  return (
    <group ref={groupRef} scale={scale}>
      {/* ===== 主拱圈（整体挤出） ===== */}
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
        <extrudeGeometry args={[mainArchShape, { depth: S.archWidth, bevelEnabled: false }]} />
        <meshStandardMaterial color="#B0B0A2" roughness={0.88} metalness={0.02} wireframe={wireframe} />
      </mesh>

      {/* ===== 个体拱石纹理层（覆盖在主拱表面，模拟28道独立拱券） ===== */}
      {/* 仅渲染外表面的拱石，通过微小凸起 + 色差体现分券效果 */}
      {!wireframe && voussoirBlocks.filter((_, i) => i % 3 === 0).map((block, i) => (
        <mesh
          key={`vs-${i}`}
          position={block.position}
          rotation={[0, 0, block.rotation]}
          castShadow
        >
          <boxGeometry args={[block.width, block.height * 0.15, block.depth]} />
          <meshStandardMaterial color={block.color} roughness={0.92} metalness={0.01} />
        </mesh>
      ))}

      {/* ===== 腹墙（桥身两侧面，拱上到桥面之间的实体） ===== */}
      {spandrelWalls.map((wall, i) => (
        <mesh
          key={`spandrel-${i}`}
          position={[0, 0, wall.zPos]}
          castShadow
        >
          <shapeGeometry args={[wall.shape]} />
          <meshStandardMaterial
            color="#A8A898"
            roughness={0.9}
            metalness={0.02}
            side={THREE.DoubleSide}
            wireframe={wireframe}
          />
        </mesh>
      ))}

      {/* ===== 4个敞肩小拱 ===== */}
      {S.smallArch.map((arch, idx) => {
        const smallShape = createArchShape(arch.span, arch.rise, 0.35, null, 24, 0);
        return (
          <mesh
            key={`small-${idx}`}
            position={[arch.offsetX, arch.offsetY, 0]}
            rotation={[Math.PI / 2, 0, 0]}
            castShadow
          >
            <extrudeGeometry args={[smallShape, { depth: S.archWidth * 0.92, bevelEnabled: false }]} />
            <meshStandardMaterial color="#C0C0B0" roughness={0.82} metalness={0.03} wireframe={wireframe} />
          </mesh>
        );
      })}

      {/* ===== 小拱拱石纹理（每个小拱表面的石块分缝） ===== */}
      {!wireframe && S.smallArch.map((arch, idx) => {
        const curve = createSmallArchCurve(arch.span, arch.rise, 24);
        const stoneCount = 8;
        return curve.filter((_, i) => i > 0 && i % Math.ceil(24 / stoneCount) === 0).map((p, si) => (
          <mesh
            key={`sa-stone-${idx}-${si}`}
            position={[p.x + arch.offsetX, p.y + arch.offsetY + 0.18, -S.archWidth * 0.46]}
          >
            <boxGeometry args={[0.12, 0.36, 0.06]} />
            <meshStandardMaterial color={stoneColor(idx * 100 + si)} roughness={0.9} />
          </mesh>
        ));
      })}

      {/* ===== 桥面填充层（主拱上方碎石填充） ===== */}
      <mesh position={[0, S.deckHeight - 0.3 - deformation, 0]} receiveShadow>
        <boxGeometry args={[S.mainSpan + 2, 0.6, S.archWidth]} />
        <meshStandardMaterial color="#A8A898" roughness={0.9} wireframe={wireframe} />
      </mesh>
      
      {/* ===== 桥面铺装（桥面石板） ===== */}
      <mesh position={[0, S.deckHeight - deformation, 0]} receiveShadow>
        <boxGeometry args={[S.mainSpan + 1, 0.12, S.totalWidth]} />
        <meshStandardMaterial color="#9A9A88" roughness={0.95} wireframe={wireframe} />
      </mesh>

      {/* ===== 桥面石板纹理（横向分缝线） ===== */}
      {!wireframe && Array.from({ length: 24 }).map((_, i) => {
        const x = (i / 23 - 0.5) * S.mainSpan * 0.95;
        return (
          <mesh key={`deck-joint-${i}`} position={[x, S.deckHeight + 0.065 - deformation, 0]} receiveShadow>
            <boxGeometry args={[0.04, 0.01, S.totalWidth * 0.98]} />
            <meshStandardMaterial color="#7A7A6A" roughness={1} />
          </mesh>
        );
      })}
      
      {/* ===== 桥面着力点网格（11个可点击点） ===== */}
      {forcePoints.map((pos, i) => {
        const xPos = pos * (S.mainSpan / 2) * 0.9;
        const isSelected = Math.abs(forcePosition - pos) < 0.01;
        
        return (
          <mesh
            key={`force-point-${i}`}
            position={[xPos, S.deckHeight + 0.08 - deformation, 0]}
            onClick={(e) => {
              e.stopPropagation();
              onPositionClick(pos);
            }}
            onPointerOver={(e) => {
              e.stopPropagation();
              document.body.style.cursor = 'pointer';
            }}
            onPointerOut={() => {
              document.body.style.cursor = 'default';
            }}
          >
            <sphereGeometry args={[isSelected ? 0.25 : 0.15, 12, 12]} />
            <meshStandardMaterial
              color={isSelected ? '#DC143C' : '#FFD700'}
              emissive={isSelected ? '#DC143C' : '#FFD700'}
              emissiveIntensity={isSelected ? 0.5 : 0.2}
              transparent
              opacity={isSelected ? 1 : 0.6}
            />
          </mesh>
        );
      })}

      {/* ===== 栏杆系统（左右两侧，详细望柱+栏板+扶手） ===== */}
      {[-1, 1].map((side) => {
        const zBase = side * S.totalWidth / 2;
        const postCount = 22; // 望柱数量
        return (
          <group key={`railing-${side}`}>
            {/* 底部通长石基 */}
            <mesh position={[0, S.deckHeight + 0.05 - deformation, zBase]}>
              <boxGeometry args={[S.mainSpan * 0.97, 0.1, 0.2]} />
              <meshStandardMaterial color="#A0A090" roughness={0.9} wireframe={wireframe} />
            </mesh>

            {/* 望柱 */}
            {Array.from({ length: postCount }).map((_, i) => {
              const x = (i / (postCount - 1) - 0.5) * S.mainSpan * 0.95;
              return (
                <group key={`post-${side}-${i}`} position={[x, S.deckHeight - deformation, zBase]}>
                  {/* 柱身（方形截面） */}
                  <mesh position={[0, S.railingHeight / 2 + 0.1, 0]}>
                    <boxGeometry args={[0.14, S.railingHeight, 0.14]} />
                    <meshStandardMaterial color={stoneColor(i * side + 500)} roughness={0.82} wireframe={wireframe} />
                  </mesh>
                  {/* 柱头（莲花宝珠造型简化为球+方台） */}
                  <mesh position={[0, S.railingHeight + 0.18, 0]}>
                    <boxGeometry args={[0.2, 0.06, 0.2]} />
                    <meshStandardMaterial color="#C8C8B8" roughness={0.75} wireframe={wireframe} />
                  </mesh>
                  <mesh position={[0, S.railingHeight + 0.28, 0]}>
                    <sphereGeometry args={[0.09, 8, 8]} />
                    <meshStandardMaterial color="#D0D0C0" roughness={0.7} wireframe={wireframe} />
                  </mesh>
                </group>
              );
            })}

            {/* 栏板（望柱之间的石板，带简化浮雕效果） */}
            {Array.from({ length: postCount - 1 }).map((_, i) => {
              const x1 = (i / (postCount - 1) - 0.5) * S.mainSpan * 0.95;
              const x2 = ((i + 1) / (postCount - 1) - 0.5) * S.mainSpan * 0.95;
              const mx = (x1 + x2) / 2;
              const panelWidth = x2 - x1 - 0.16;
              return (
                <group key={`panel-${side}-${i}`}>
                  {/* 栏板主体 */}
                  <mesh position={[mx, S.deckHeight + S.railingHeight / 2 + 0.1 - deformation, zBase]}>
                    <boxGeometry args={[panelWidth, S.railingHeight * 0.75, 0.07]} />
                    <meshStandardMaterial color={stoneColor(i * side + 800)} roughness={0.78} wireframe={wireframe} />
                  </mesh>
                  {/* 浮雕装饰条纹（简化为凸线） */}
                  {!wireframe && (
                    <mesh position={[mx, S.deckHeight + S.railingHeight / 2 + 0.1 - deformation, zBase + side * 0.04]}>
                      <boxGeometry args={[panelWidth * 0.8, S.railingHeight * 0.35, 0.015]} />
                      <meshStandardMaterial color="#C5C5B5" roughness={0.7} />
                    </mesh>
                  )}
                </group>
              );
            })}

            {/* 顶部扶手 */}
            <mesh position={[0, S.deckHeight + S.railingHeight + 0.12 - deformation, zBase]}>
              <boxGeometry args={[S.mainSpan * 0.97, 0.06, 0.16]} />
              <meshStandardMaterial color="#BFBFAF" roughness={0.8} wireframe={wireframe} />
            </mesh>
          </group>
        );
      })}
      
      {/* ===== 桥台（左右两端，增加分层石砌效果） ===== */}
      {[-1, 1].map((side) => {
        const xBase = side * (S.mainSpan / 2 + S.abutmentLength / 2);
        return (
          <group key={`abutment-${side}`}>
            {/* 桥台主体 */}
            <mesh position={[xBase, -S.abutmentDepth / 2, 0]} receiveShadow>
              <boxGeometry args={[S.abutmentLength, S.abutmentDepth, S.abutmentWidth]} />
              <meshStandardMaterial color="#8A8A78" roughness={0.95} wireframe={wireframe} />
            </mesh>
            {/* 桥台上方过渡斜面 */}
            <mesh position={[xBase, S.abutmentDepth * 0.3, 0]} receiveShadow>
              <boxGeometry args={[S.abutmentLength * 0.8, S.abutmentDepth * 0.6, S.abutmentWidth * 0.95]} />
              <meshStandardMaterial color="#929280" roughness={0.93} wireframe={wireframe} />
            </mesh>
            {/* 石砌分层纹理 */}
            {!wireframe && Array.from({ length: 5 }).map((_, li) => (
              <mesh
                key={`ab-layer-${side}-${li}`}
                position={[xBase, -S.abutmentDepth + li * (S.abutmentDepth / 5) + 0.18, S.abutmentWidth / 2 + 0.01]}
              >
                <boxGeometry args={[S.abutmentLength * 0.98, 0.03, 0.02]} />
                <meshStandardMaterial color="#6A6A5A" roughness={1} />
              </mesh>
            ))}
          </group>
        );
      })}
      
      {/* ===== 荷载可视化：红色向下箭头 ===== */}
      {load > 0 && (
        <group position={[forcePosition * (S.mainSpan / 2) * 0.9, S.deckHeight + 1.5 - deformation, 0]}>
          <mesh>
            <coneGeometry args={[0.3, 1.0, 8]} />
            <meshStandardMaterial
              color="#DC143C"
              emissive="#DC143C"
              emissiveIntensity={0.5}
            />
          </mesh>
          <mesh position={[0, 0.8, 0]}>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshStandardMaterial color="#DC143C" emissive="#DC143C" emissiveIntensity={0.3} />
          </mesh>
        </group>
      )}
      
      {/* ===== 地面 ===== */}
      <mesh position={[0, -S.abutmentDepth - 0.2, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[80, 30]} />
        <meshStandardMaterial color="#3A3A30" roughness={1} />
      </mesh>
      
      {/* ===== 水面（河流） ===== */}
      <mesh position={[0, -S.abutmentDepth + 0.3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[60, 20]} />
        <meshStandardMaterial
          color="#2A4A5A"
          roughness={0.2}
          metalness={0.6}
          transparent
          opacity={0.7}
        />
      </mesh>

      {/* ===== 河岸护坡 ===== */}
      {[-1, 1].map((side) => (
        <mesh
          key={`bank-${side}`}
          position={[side * 32, -S.abutmentDepth - 0.5, 0]}
          receiveShadow
        >
          <boxGeometry args={[18, 0.8, 22]} />
          <meshStandardMaterial color="#4A4A3A" roughness={1} wireframe={wireframe} />
        </mesh>
      ))}
    </group>
  );
}

/* ========== 应力分布 ECharts 配置（根据着力点位置计算） ========== */
function getStressChartOption(load: number, forcePosition: number) {
  const positions = ['左拱脚', '左1/4跨', '拱顶', '右1/4跨', '右拱脚'];
  /* 位置对应的归一化坐标：-1到1 */
  const posCoords = [-1, -0.5, 0, 0.5, 1];
  
  /* 基础应力（无荷载时） */
  const baseStress = [85, 45, 25, 45, 85];
  
  /* 根据着力点位置计算影响线系数 */
  const data = baseStress.map((base, i) => {
    const posCoord = posCoords[i];
    /* 影响线：距离着力点越近，应力增加越多 */
    const distance = Math.abs(posCoord - forcePosition);
    const influenceFactor = 1 - distance * 0.3; // 距离越远影响越小
    const stressIncrease = load * influenceFactor * 0.8;
    
    return Math.min(120, base + stressIncrease);
  });

  return {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' as const },
    xAxis: {
      type: 'category' as const,
      data: positions,
      axisLine: { lineStyle: { color: '#C5A55A40' } },
      axisLabel: { color: '#999', fontSize: 10 },
    },
    yAxis: {
      type: 'value' as const,
      name: '应力 (MPa)',
      nameTextStyle: { color: '#999', fontSize: 10 },
      max: 120,
      axisLine: { lineStyle: { color: '#C5A55A40' } },
      axisLabel: { color: '#999', fontSize: 10 },
      splitLine: { lineStyle: { color: '#ffffff08' } },
    },
    series: [
      {
        type: 'bar',
        data,
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#8B2500' },
              { offset: 1, color: '#C5A55A' },
            ],
          },
          borderRadius: [4, 4, 0, 0],
        },
        barWidth: '40%',
      },
    ],
    grid: { top: 30, bottom: 30, left: 50, right: 20 },
  };
}

/* ========== 视图模式配置 ========== */
const VIEW_MODES: { key: ViewMode; label: string; desc: string }[] = [
  { key: 'solid', label: '实体模型', desc: '增强版几何建模' },
  { key: 'pointcloud', label: 'SfM 点云', desc: '稀疏重建可视化' },
  { key: 'wireframe', label: '线框结构', desc: '结构线分析' },
];

/* ========== 桥梁页面主组件 ========== */
function BridgePage() {
  const [load, setLoad] = useState(0);
  const [forcePosition, setForcePosition] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('solid');

  return (
    <div className="min-h-screen ink-bg">
      {/* 页面标题 */}
      <div className="text-center pt-8 pb-4 px-4">
        <h1 className="text-3xl md:text-4xl font-bold text-imperial-gold tracking-wider">
          赵州桥 · 千年抗震奥秘
        </h1>
        <p className="text-gray-500 text-sm mt-2 tracking-widest">
          敞肩拱结构力学可视化 · SfM 三维重建 · 交互式载荷模拟
        </p>
        <div className="chinese-divider max-w-xs mx-auto mt-4" />
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 3D 视口 */}
          <div className="lg:col-span-2 h-[500px] md:h-[600px] gold-border rounded-lg overflow-hidden bg-imperial-deeper/50 relative">
            <Canvas camera={{ position: [0, 3, 8], fov: 45 }} shadows>
              <Suspense fallback={null}>
                <ambientLight intensity={0.4} />
                <directionalLight position={[5, 8, 5]} intensity={1} castShadow />

                {/* 根据视图模式渲染不同内容 */}
                {viewMode === 'pointcloud' ? (
                  <PointCloudBridge showCameras />
                ) : (
                  <BridgeModel
                    load={load}
                    forcePosition={forcePosition}
                    onPositionClick={setForcePosition}
                    wireframe={viewMode === 'wireframe'}
                  />
                )}

                <ContactShadows position={[0, -0.51, 0]} opacity={0.3} scale={15} blur={2} />
                <OrbitControls enablePan enableZoom minDistance={4} maxDistance={20} />
                <hemisphereLight args={['#FFA040', '#2A3A4A', 0.4]} />
                <pointLight position={[-8, 6, -6]} intensity={0.3} color="#FFEEDD" />
              </Suspense>
            </Canvas>

            {/* 视图模式浮动切换栏 */}
            <div className="absolute top-3 left-3 flex gap-1.5 bg-black/60 backdrop-blur-sm rounded-lg p-1">
              {VIEW_MODES.map((m) => (
                <button
                  key={m.key}
                  onClick={() => setViewMode(m.key)}
                  title={m.desc}
                  className={`px-2.5 py-1 rounded text-[11px] transition-all ${
                    viewMode === m.key
                      ? 'bg-imperial-gold text-imperial-dark font-bold'
                      : 'text-gray-400 hover:text-imperial-gold hover:bg-white/5'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* 点云模式说明 */}
            {viewMode === 'pointcloud' && (
              <div className="absolute bottom-3 left-3 right-3 bg-black/70 backdrop-blur-sm rounded-lg px-3 py-2">
                <p className="text-[11px] text-gray-300 leading-relaxed">
                  <span className="text-imperial-gold font-bold">SfM 稀疏重建</span>
                  {' '}— 基于 3D_reconstruction_of_bridge 项目，通过多视图几何与三角化算法（tri_method）从照片恢复桥梁三维点云。
                  <span className="text-blue-400"> 蓝色八面体</span> 标记相机位置，
                  <span className="text-red-400"> 红色线框</span> 为重建包围盒。
                </p>
              </div>
            )}
          </div>

          {/* 右侧控制面板 */}
          <div className="space-y-4">
            {/* 荷载控制 */}
            <div className="gold-border rounded-lg p-4 bg-imperial-deeper/50">
              <h3 className="text-imperial-gold text-sm font-bold tracking-wider mb-3">载荷控制</h3>
              <div className="space-y-3">
                {/* 着力点位置显示 */}
                <div className="text-xs text-gray-400 bg-imperial-gold/5 px-2 py-1.5 rounded">
                  <span className="text-imperial-gold/80">着力点位置：</span>
                  <span className="text-imperial-gold font-bold ml-1">
                    {forcePosition === 0 ? '拱顶' : 
                     forcePosition < -0.6 ? '左拱脚' :
                     forcePosition < -0.2 ? '左1/4跨' :
                     forcePosition < 0.2 ? '拱顶附近' :
                     forcePosition < 0.6 ? '右1/4跨' : '右拱脚'}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>施加荷载</span>
                  <span className="text-imperial-gold font-bold">{load} kN</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={load}
                  onChange={(e) => setLoad(Number(e.target.value))}
                  className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-imperial-gold"
                />
                <div className="flex justify-between text-[10px] text-gray-600">
                  <span>0 kN</span>
                  <span>100 kN</span>
                </div>
                <div className="flex gap-2">
                  {[0, 25, 50, 75, 100].map((v) => (
                    <button
                      key={v}
                      onClick={() => setLoad(v)}
                      className={`flex-1 py-1 rounded text-xs transition-all ${
                        load === v
                          ? 'bg-imperial-gold text-imperial-dark font-bold'
                          : 'border border-gray-700 text-gray-500 hover:border-imperial-gold/40 hover:text-imperial-gold'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 应力分布图表 */}
            <div className="gold-border rounded-lg p-4 bg-imperial-deeper/50">
              <h3 className="text-imperial-gold text-sm font-bold tracking-wider mb-2">应力分布</h3>
              <ReactEChartsCore
                option={getStressChartOption(load, forcePosition)}
                style={{ height: 200 }}
                opts={{ renderer: 'canvas' }}
              />
              <p className="text-xs text-gray-500 mt-2 text-center">
                点击桥面金色圆点可改变着力点位置
              </p>
            </div>

            {/* 三维重建技术说明 */}
            <div className="gold-border rounded-lg p-4 bg-imperial-deeper/50">
              <h3 className="text-imperial-gold text-sm font-bold tracking-wider mb-3">3D 重建技术</h3>
              <div className="space-y-2 text-xs text-gray-400 leading-relaxed">
                <p>
                  <span className="text-imperial-gold">SfM 流程：</span>
                  基于 VisualSFM + SiftGPU 进行特征提取与匹配，经 Bundle Adjustment 恢复相机位姿与稀疏点云。
                </p>
                <p>
                  <span className="text-imperial-gold">三角化：</span>
                  利用多视图投影矩阵，通过 cv2.triangulatePoints 将 2D 特征点对应到 3D 空间坐标。
                </p>
                <p>
                  <span className="text-imperial-gold">离群点过滤：</span>
                  基于距离均值 ± 标准差的统计滤波，去除重建噪声点。
                </p>
              </div>
            </div>

            {/* 桥梁信息卡片 */}
            <div className="gold-border rounded-lg p-4 bg-imperial-deeper/50">
              <h3 className="text-imperial-gold text-sm font-bold tracking-wider mb-3">桥梁档案</h3>
              <div className="space-y-2 text-xs">
                {Object.entries({
                  '名称': BRIDGE_INFO.name,
                  '建造者': BRIDGE_INFO.builder,
                  '年代': BRIDGE_INFO.dynasty,
                  '净跨': BRIDGE_INFO.span,
                  '矢高': BRIDGE_INFO.rise,
                  '矢跨比': BRIDGE_INFO.ratio,
                }).map(([key, val]) => (
                  <div key={key} className="flex">
                    <span className="text-imperial-gold/60 w-14 shrink-0">{key}</span>
                    <span className="text-gray-400">{val}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-imperial-gold/10">
                <p className="text-gray-400 text-xs leading-relaxed">
                  <span className="text-imperial-gold">敞肩拱创举：</span>
                  {BRIDGE_INFO.feature}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BridgePage;
