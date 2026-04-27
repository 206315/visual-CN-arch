import { useRef, useState, useMemo, Suspense, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

/* 构件类型枚举 */
type PartType = 'dou' | 'gong' | 'ang' | 'fang' | 'chuan' | 'pillar';

type VisibilityState = Record<PartType, boolean>;

type ForceStep = {
  layer: number;
  label: string;
  desc: string;
};

/* 构件数据结构 */
interface PartDef {
  name: string;
  type: PartType;
  color: string;
  paintColor?: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  params: Record<string, number>;
  desc: string;
  layer: number;
}

/* 七铺作斗拱构件定义 */
const DOUGONG_PARTS: PartDef[] = [
  {
    name: '柱头', type: 'pillar', color: '#6B3A2A',
    position: [0, -0.6, 0],
    params: { topW: 0.7, botW: 0.8, h: 0.6, d: 0.7 },
    desc: '檐柱柱头，斗拱的直接承载基础。柱头微收（侧脚），上刻卷草纹饰。',
    layer: 0,
  },
  {
    name: '栌斗（大斗）', type: 'dou', color: '#8B5E3C',
    position: [0, 0, 0],
    params: { topW: 1.0, botW: 0.72, h: 0.48, d: 1.0, slotW: 0.52, slotD: 0.16 },
    desc: '坐斗，方形，上大下小，四面斗耳微翘。顶面开十字卯口，承接第一跳华拱与泥道拱。',
    layer: 1,
  },
  {
    name: '华拱（一跳）', type: 'gong', color: '#9B6B45',
    position: [0, 0.48, 0],
    params: { span: 2.0, h: 0.26, w: 0.42, curve: 0.12 },
    desc: '第一跳出跳拱臂，沿面阔方向伸出。两端卷杀为弧形曲面，状如弯月。',
    layer: 2,
  },
  {
    name: '泥道拱', type: 'gong', color: '#A57A50',
    position: [0, 0.48, 0],
    rotation: [0, Math.PI / 2, 0],
    params: { span: 1.8, h: 0.26, w: 0.42, curve: 0.10 },
    desc: '与华拱正交的纵向拱臂，沿进深方向。两端同样卷杀，与华拱十字相交。',
    layer: 2,
  },
  {
    name: '交互斗（前左）', type: 'dou', color: '#A8754D',
    position: [-0.72, 0.74, -0.62],
    params: { topW: 0.38, botW: 0.28, h: 0.28, d: 0.38, slotW: 0.22, slotD: 0.10 },
    desc: '位于一跳拱臂交叉点外侧的小斗，承接上层拱件。',
    layer: 3,
  },
  {
    name: '交互斗（前右）', type: 'dou', color: '#A8754D',
    position: [0.72, 0.74, -0.62],
    params: { topW: 0.38, botW: 0.28, h: 0.28, d: 0.38, slotW: 0.22, slotD: 0.10 },
    desc: '位于一跳拱臂交叉点外侧的小斗，承接上层拱件。',
    layer: 3,
  },
  {
    name: '交互斗（后左）', type: 'dou', color: '#A8754D',
    position: [-0.72, 0.74, 0.62],
    params: { topW: 0.38, botW: 0.28, h: 0.28, d: 0.38, slotW: 0.22, slotD: 0.10 },
    desc: '位于一跳拱臂交叉点外侧的小斗。',
    layer: 3,
  },
  {
    name: '交互斗（后右）', type: 'dou', color: '#A8754D',
    position: [0.72, 0.74, 0.62],
    params: { topW: 0.38, botW: 0.28, h: 0.28, d: 0.38, slotW: 0.22, slotD: 0.10 },
    desc: '位于一跳拱臂交叉点外侧的小斗。',
    layer: 3,
  },
  {
    name: '华拱（二跳）', type: 'gong', color: '#B08050',
    position: [0, 1.02, 0],
    params: { span: 2.8, h: 0.28, w: 0.44, curve: 0.15 },
    desc: '第二跳华拱，出挑更远。弧形卷杀更为舒展，线条优美如飞翼。',
    layer: 4,
  },
  {
    name: '瓜子拱', type: 'gong', color: '#B8874F',
    position: [0, 1.02, 0],
    rotation: [0, Math.PI / 2, 0],
    params: { span: 2.4, h: 0.26, w: 0.40, curve: 0.12 },
    desc: '二跳层的纵向短拱，形似瓜子，两端卷杀圆润。',
    layer: 4,
  },
  {
    name: '下昂（前）', type: 'ang', color: '#7A5230',
    position: [0, 1.30, -0.5],
    rotation: [-0.35, 0, 0],
    params: { length: 2.6, h: 0.22, w: 0.30, tipLen: 0.4 },
    desc: '斜向下倾的构件，昂头伸出檐外下垂。利用杠杆原理挑起屋檐。',
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
  {
    name: '齐心斗', type: 'dou', color: '#C49A5C',
    position: [0, 1.52, 0],
    params: { topW: 0.50, botW: 0.36, h: 0.30, d: 0.50, slotW: 0.28, slotD: 0.10 },
    desc: '最顶层正中的斗，承接耍头与承托枋。',
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
  {
    name: '枋（承椽枋）', type: 'fang', color: '#B0855A', paintColor: '#2B6E5A',
    position: [0, 1.82, 0],
    params: { w: 3.6, h: 0.24, d: 0.72 },
    desc: '最顶部横向枋木，表面施以旋子彩画。',
    layer: 7,
  },
  {
    name: '椽条组', type: 'chuan', color: '#8C6840',
    position: [0, 2.10, 0],
    params: { radius: 0.06, length: 3.8, count: 14, spacing: 0.28 },
    desc: '圆形截面椽木，排列于枋上承托屋面。',
    layer: 8,
  },
];

const FORCE_STEPS: ForceStep[] = [
  { layer: 8, label: '屋面与椽条', desc: '屋面荷载先由椽条汇集到承椽枋。' },
  { layer: 7, label: '枋木分配', desc: '枋木把集中荷载摊分到上层斗与拱臂。' },
  { layer: 6, label: '齐心斗与散斗', desc: '斗承接上部压力，并把荷载转交给二跳拱臂。' },
  { layer: 5, label: '下昂杠杆', desc: '下昂以斜向杠杆方式托挑屋檐，改变力的传递路径。' },
  { layer: 4, label: '二跳拱层', desc: '二跳华拱和瓜子拱扩大支承范围，降低局部集中受力。' },
  { layer: 3, label: '交互斗承压', desc: '小斗在拱臂节点处承压，形成多点支承。' },
  { layer: 2, label: '一跳拱层', desc: '华拱与泥道拱正交工作，把荷载导向中心大斗。' },
  { layer: 1, label: '栌斗汇力', desc: '栌斗汇集各层传来的压力，是斗拱的关键受力节点。' },
  { layer: 0, label: '柱头落地', desc: '柱头最终把压力传入立柱和下部基础。' },
];

/* 几何体生成函数 */
function createDouGeometry(topW: number, botW: number, h: number, d: number, slotW: number, slotD: number): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  const hw = topW / 2;
  const hbw = botW / 2;
  shape.moveTo(-hbw, 0);
  shape.lineTo(-hw, h);
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

function createGongGeometry(span: number, h: number, w: number, curve: number): THREE.BufferGeometry {
  const segments = 24;
  const shape = new THREE.Shape();
  const hw = w / 2;
  const hh = h / 2;
  shape.moveTo(-hw, -hh);
  shape.lineTo(-hw, hh);
  shape.lineTo(hw, hh);
  shape.lineTo(hw, -hh);
  shape.closePath();

  const points: THREE.Vector3[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const x = (t - 0.5) * span;
    const normalizedDist = Math.abs(t - 0.5) * 2;
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

function createAngGeometry(length: number, h: number, w: number, tipLen: number): THREE.BufferGeometry {
  const hw = w / 2;
  const hh = h / 2;
  const halfLen = length / 2;

  const shape = new THREE.Shape();
  shape.moveTo(-halfLen, -hh);
  shape.lineTo(-halfLen, hh);
  shape.lineTo(halfLen - tipLen, hh);
  shape.quadraticCurveTo(halfLen - tipLen * 0.3, hh * 0.5, halfLen, -hh * 0.3);
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

/* 3D 构件组件 */
function PartMesh({
  part,
  index,
  totalParts,
  explodeMode,
  isVisible,
  selected,
  onSelect,
  forceLoad,
  forceActiveLayer,
  showForceFlow,
}: {
  part: PartDef;
  index: number;
  totalParts: number;
  explodeMode: 'none' | 'vertical' | 'circular';
  isVisible: boolean;
  selected: boolean;
  onSelect: () => void;
  forceLoad: number;
  forceActiveLayer: number;
  showForceFlow: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (groupRef.current && !groupRef.current.userData.originalPosition) {
      groupRef.current.userData.originalPosition = groupRef.current.position.clone();
      groupRef.current.userData.layer = part.layer;
    }
  }, [part.layer]);

  useFrame(() => {
    if (!groupRef.current) {
      return;
    }

    const originalPosition = groupRef.current.userData.originalPosition as THREE.Vector3 | undefined;
    if (!originalPosition) {
      return;
    }

    let targetX = originalPosition.x;
    let targetY = originalPosition.y;
    let targetZ = originalPosition.z;

    if (explodeMode === 'vertical') {
      targetY = originalPosition.y + part.layer * 0.65;
    }

    if (explodeMode === 'circular') {
      const angleStep = (Math.PI * 2) / totalParts;
      const angle = index * angleStep;
      const radius = 0.3 + part.layer * 0.35;

      targetX = originalPosition.x + Math.cos(angle) * radius;
      targetY = originalPosition.y + part.layer * 0.3;
      targetZ = originalPosition.z + Math.sin(angle) * radius;
    }

    groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, targetX, 0.08);
    groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, 0.08);
    groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, targetZ, 0.08);
  });

  const forceDistance = Math.abs(part.layer - forceActiveLayer);
  const forceInfluence = showForceFlow ? Math.max(0, 1 - forceDistance / 2.2) * (forceLoad / 100) : 0;
  const forceColor = new THREE.Color(part.color).lerp(new THREE.Color('#FFB347'), forceInfluence);
  const matColor = selected ? '#FFD700' : hovered ? '#E8C56D' : forceColor.getStyle();
  const emissive = selected ? '#FFD700' : hovered ? '#C5A55A' : forceInfluence > 0 ? '#FF9A2A' : '#000000';
  const emissiveIntensity = selected ? 0.25 : hovered ? 0.12 : forceInfluence * 0.38;

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
      console.warn('[DouGong] geometry creation failed', e);
      return null;
    }
  }, [part.type, part.params]);

  const geometryNode = useMemo(() => {
    const p = part.params;
    if (part.type === 'fang') return <boxGeometry args={[p.w, p.h, p.d]} />;
    if (part.type === 'chuan') return null;
    if (geometry) return <primitive object={geometry} attach="geometry" />;
    return <boxGeometry args={[p.topW || p.span || p.length || 1, p.h || 0.3, p.d || p.w || 0.5]} />;
  }, [geometry, part.type, part.params]);

  if (part.type === 'chuan') {
    const { radius, length, count, spacing } = part.params;
    const startZ = -((count - 1) * spacing) / 2;
    return (
      <group
        ref={groupRef}
        visible={isVisible}
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
        {(selected || hovered) && (
          <Html position={[0, 0.3, 0]} center distanceFactor={8}>
            <div className="bg-imperial-deeper/90 text-imperial-gold px-3 py-1 rounded text-xs whitespace-nowrap border border-imperial-gold/30">
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
      visible={isVisible}
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

      {part.type === 'fang' && part.paintColor && (
        <>
          <mesh position={[0, part.params.h / 2 + 0.005, 0]}>
            <boxGeometry args={[part.params.w * 0.96, 0.02, part.params.d * 0.6]} />
            <meshStandardMaterial color={part.paintColor} roughness={0.4} metalness={0.15} />
          </mesh>
          <mesh position={[0, part.params.h / 2 + 0.012, 0]}>
            <boxGeometry args={[part.params.w * 0.98, 0.008, part.params.d * 0.95]} />
            <meshStandardMaterial color="#D4A843" roughness={0.3} metalness={0.4} />
          </mesh>
        </>
      )}

      {(selected || hovered) && (
        <Html position={[0, 0.4, 0]} center distanceFactor={8}>
          <div className="bg-imperial-deeper/90 text-imperial-gold px-3 py-1 rounded text-xs whitespace-nowrap border border-imperial-gold/30">
            {part.name}
          </div>
        </Html>
      )}
    </group>
  );
}

/* 3D 场景 */
function DouGongScene({
  explodeMode,
  selectedIdx,
  visibleTypes,
  soloMode,
  forceLoad,
  showForceFlow,
  onSelect,
}: {
  explodeMode: 'none' | 'vertical' | 'circular';
  selectedIdx: number | null;
  visibleTypes: VisibilityState;
  soloMode: boolean;
  forceLoad: number;
  showForceFlow: boolean;
  onSelect: (i: number | null) => void;
}) {
  const [forcePhase, setForcePhase] = useState(0);

  useFrame((_, delta) => {
    if (showForceFlow) {
      setForcePhase((current) => (current + delta * 1.15) % FORCE_STEPS.length);
    }
  });

  const activeForceStep = FORCE_STEPS[Math.floor(forcePhase) % FORCE_STEPS.length];

  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[6, 10, 6]} intensity={1.2} castShadow />
      <directionalLight position={[-4, 6, -4]} intensity={0.4} />
      <directionalLight position={[0, -2, 5]} intensity={0.15} />

      {DOUGONG_PARTS.map((part, i) => (
        <PartMesh
          key={i}
          part={part}
          index={i}
          totalParts={DOUGONG_PARTS.length}
          explodeMode={explodeMode}
          isVisible={visibleTypes[part.type] && (!soloMode || selectedIdx === null || selectedIdx === i)}
          selected={selectedIdx === i}
          forceLoad={forceLoad}
          forceActiveLayer={activeForceStep.layer}
          showForceFlow={showForceFlow}
          onSelect={() => onSelect(selectedIdx === i ? null : i)}
        />
      ))}

      {showForceFlow && explodeMode === 'none' && (
        <group>
          <Html position={[0, 2.75, 0]} center distanceFactor={8}>
            <div className="bg-black/80 text-imperial-gold px-3 py-2 rounded border border-imperial-gold/30 text-xs whitespace-nowrap">
              {activeForceStep.label} · 荷载 {forceLoad}%
            </div>
          </Html>
          <mesh position={[0, 2.52, 0]} rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[0.14 + forceLoad * 0.001, 0.58, 18]} />
            <meshStandardMaterial color="#FF9A2A" emissive="#FF9A2A" emissiveIntensity={0.45} />
          </mesh>
        </group>
      )}

      <ContactShadows position={[0, -0.95, 0]} opacity={0.5} scale={12} blur={2.5} far={4} />
      <OrbitControls
        enablePan
        enableZoom
        minDistance={3}
        maxDistance={18}
        autoRotate={explodeMode === 'none'}
        autoRotateSpeed={0.4}
        maxPolarAngle={Math.PI * 0.85}
      />
      <hemisphereLight args={['#C5A55A', '#3A2A1A', 0.5]} />
      <pointLight position={[-5, 5, -5]} intensity={0.3} color="#FFEEDD" />
    </>
  );
}

/* 页面主组件 */
function DouGongPageEnhanced() {
  const [explodeMode, setExplodeMode] = useState<'none' | 'vertical' | 'circular'>('none');
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [soloMode, setSoloMode] = useState(false);
  const [showForceFlow, setShowForceFlow] = useState(true);
  const [forceLoad, setForceLoad] = useState(65);
  const [visibleTypes, setVisibleTypes] = useState<VisibilityState>({
    dou: true,
    gong: true,
    ang: true,
    fang: true,
    chuan: true,
    pillar: true,
  });

  const selectedPart = selectedIdx !== null ? DOUGONG_PARTS[selectedIdx] : null;
  const loadLevel = forceLoad > 75 ? '高荷载' : forceLoad > 40 ? '中等荷载' : '轻荷载';
  const visiblePartCount = useMemo(
    () => DOUGONG_PARTS.filter((part, index) => visibleTypes[part.type] && (!soloMode || selectedIdx === null || selectedIdx === index)).length,
    [visibleTypes, soloMode, selectedIdx]
  );

  const togglePartType = (type: PartType) => {
    setVisibleTypes((current) => ({
      ...current,
      [type]: !current[type],
    }));
  };

  const resetVisibility = () => {
    setVisibleTypes({
      dou: true,
      gong: true,
      ang: true,
      fang: true,
      chuan: true,
      pillar: true,
    });
    setSoloMode(false);
  };

  return (
    <div className="min-h-screen ink-bg">
      <div className="text-center pt-8 pb-4 px-4">
        <h1 className="text-3xl md:text-4xl font-bold text-imperial-gold tracking-wider">
          斗拱智慧拆解
        </h1>
        <p className="text-gray-500 text-sm mt-2 tracking-widest">
          七铺作双抄双下昂 · 多种拆解模式 · 流畅动画效果
        </p>
        <div className="chinese-divider max-w-xs mx-auto mt-4" />
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-[500px] md:h-[600px] gold-border rounded-lg overflow-hidden bg-imperial-deeper/50">
            <Canvas camera={{ position: [3.5, 3, 5], fov: 42 }} shadows>
              <Suspense fallback={null}>
                <DouGongScene
                  explodeMode={explodeMode}
                  selectedIdx={selectedIdx}
                  visibleTypes={visibleTypes}
                  soloMode={soloMode}
                  forceLoad={forceLoad}
                  showForceFlow={showForceFlow}
                  onSelect={setSelectedIdx}
                />
              </Suspense>
            </Canvas>
          </div>

          <div className="space-y-4">
            <div className="gold-border rounded-lg p-4 bg-imperial-deeper/50">
              <h3 className="text-imperial-gold text-sm font-bold tracking-wider mb-3">🎬 动画控制</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setExplodeMode(explodeMode === 'vertical' ? 'none' : 'vertical')}
                  className={`px-4 py-2 rounded text-xs tracking-wider transition-all ${
                    explodeMode === 'vertical'
                      ? 'bg-imperial-gold text-imperial-dark font-bold'
                      : 'border border-imperial-gold/40 text-imperial-gold hover:bg-imperial-gold/10'
                  }`}
                >
                  {explodeMode === 'vertical' ? '🔧 复原' : '💥 垂直拆解'}
                </button>
                <button
                  onClick={() => setExplodeMode(explodeMode === 'circular' ? 'none' : 'circular')}
                  className={`px-4 py-2 rounded text-xs tracking-wider transition-all ${
                    explodeMode === 'circular'
                      ? 'bg-imperial-gold text-imperial-dark font-bold'
                      : 'border border-imperial-gold/40 text-imperial-gold hover:bg-imperial-gold/10'
                  }`}
                >
                  {explodeMode === 'circular' ? '🔧 复原' : '🌀 环形拆解'}
                </button>
                <button
                  onClick={() => setSelectedIdx(null)}
                  className="px-4 py-2 rounded text-xs tracking-wider border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition-all"
                >
                  取消选中
                </button>
                <button
                  onClick={() => setSoloMode((current) => !current)}
                  className={`px-4 py-2 rounded text-xs tracking-wider transition-all ${
                    soloMode
                      ? 'bg-imperial-gold text-imperial-dark font-bold'
                      : 'border border-imperial-gold/40 text-imperial-gold hover:bg-imperial-gold/10'
                  }`}
                >
                  {soloMode ? '👁 退出聚焦' : '🎯 聚焦选中'}
                </button>
              </div>
              <p className="text-[10px] text-gray-600 mt-2">
                当前显示 {visiblePartCount} / {DOUGONG_PARTS.length} 个构件 · {new Set(DOUGONG_PARTS.map(p => p.layer)).size} 个层级
              </p>
            </div>

            <div className="gold-border rounded-lg p-4 bg-imperial-deeper/50">
              <h3 className="text-imperial-gold text-sm font-bold tracking-wider mb-3">⚖️ 受力传递</h3>
              <div className="space-y-3">
                <button
                  onClick={() => setShowForceFlow((current) => !current)}
                  className={`w-full py-2 rounded text-xs tracking-wider transition-all ${
                    showForceFlow
                      ? 'bg-imperial-gold text-imperial-dark font-bold'
                      : 'border border-imperial-gold/40 text-imperial-gold hover:bg-imperial-gold/10'
                  }`}
                >
                  {showForceFlow ? '受力动画 ON' : '受力动画 OFF'}
                </button>
                <div>
                  <div className="flex justify-between text-xs text-gray-400 mb-2">
                    <span>屋面荷载</span>
                    <span className="text-imperial-gold font-bold">{forceLoad}% · {loadLevel}</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={100}
                    value={forceLoad}
                    onChange={(e) => setForceLoad(Number(e.target.value))}
                    className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-imperial-gold"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2 text-[10px]">
                  {FORCE_STEPS.slice(0, 6).map((step) => (
                    <div key={step.layer} className="rounded border border-imperial-gold/10 bg-black/20 px-2 py-1 text-gray-400">
                      <span className="text-imperial-gold/80">L{step.layer}</span> {step.label}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  高亮波从椽条、枋木、斗拱层逐步传到柱头，展示屋面荷载如何被层层分散，而不是集中压在单一节点上。
                </p>
              </div>
            </div>

            <div className="gold-border rounded-lg p-4 bg-imperial-deeper/50">
              <h3 className="text-imperial-gold text-sm font-bold tracking-wider mb-3">🧱 结构图层</h3>
              <div className="flex flex-wrap gap-2">
                {([
                  ['pillar', '柱础'],
                  ['dou', '斗'],
                  ['gong', '拱'],
                  ['ang', '昂'],
                  ['fang', '枋'],
                  ['chuan', '椽'],
                ] as [PartType, string][]).map(([type, label]) => (
                  <button
                    key={type}
                    onClick={() => togglePartType(type)}
                    className={`px-3 py-2 rounded text-xs tracking-wider transition-all ${
                      visibleTypes[type]
                        ? 'bg-imperial-gold/15 text-imperial-gold border border-imperial-gold/30'
                        : 'border border-gray-700 text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <button
                onClick={resetVisibility}
                className="mt-3 px-4 py-2 rounded text-xs tracking-wider border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition-all"
              >
                重置图层
              </button>
            </div>

            <div className="gold-border rounded-lg p-4 bg-imperial-deeper/50 min-h-[160px]">
              <h3 className="text-imperial-gold text-sm font-bold tracking-wider mb-3">📋 构件详情</h3>
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

            <div className="gold-border rounded-lg p-4 bg-imperial-deeper/50">
              <h3 className="text-imperial-gold text-sm font-bold tracking-wider mb-3">✨ 新增功能</h3>
              <ul className="text-xs text-gray-400 space-y-2">
                <li>• 受力传递：屋面荷载沿椽、枋、斗、拱、柱逐层高亮</li>
                <li>• 荷载调节：拖动滑块观察构件颜色随受力强弱变化</li>
                <li>• 垂直拆解：按层级垂直分离构件</li>
                <li>• 环形拆解：构件呈圆形向外扩散</li>
                <li>• 聚焦选中：仅保留当前研究构件</li>
                <li>• 图层显隐：按斗、拱、昂、枋、椽分别开关</li>
                <li>• 智能复原：一键恢复原始位置</li>
              </ul>
            </div>

            <div className="gold-border rounded-lg p-4 bg-imperial-deeper/50">
              <h3 className="text-imperial-gold text-sm font-bold tracking-wider mb-3">📖 营造法式</h3>
              <p className="text-gray-400 text-xs leading-relaxed">
                七铺作斗拱是宋代《营造法式》中最高等级的斗拱形制，由栌斗、华拱、泥道拱、瓜子拱、
                令拱、下昂、散斗等多种构件组成。其精妙在于：拱臂两端"卷杀"为弧形曲面，
                下昂利用杠杆原理挑起沉重屋檐，实现了力与美的完美统一。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DouGongPageEnhanced;
