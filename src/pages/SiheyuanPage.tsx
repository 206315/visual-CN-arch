import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, Html, OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

type CourtyardViewMode = 'overview' | 'courtyard' | 'gate' | 'free';
type LightingMode = 'day' | 'sunset' | 'night';
type DisplayMode = '2d' | '3d';
type SeasonMode = 'spring' | 'summer' | 'autumn' | 'winter';
type TimeMode = 'morning' | 'noon' | 'afternoon';
type WindMode = 'south' | 'north';
type SpaceKey = 'main' | 'east' | 'west' | 'gate' | 'screen';

const SIHEYUAN_MODEL_PATH = new URL('../../2d27ecb8-fc0f-4df1-8d44-ea4b7d800d06.glb', import.meta.url).href;

const VIEW_MODE_META: { key: CourtyardViewMode; label: string; desc: string }[] = [
  { key: 'overview', label: '整体鸟瞰', desc: '俯瞰四合院总体格局' },
  { key: 'courtyard', label: '中庭视角', desc: '观察院落围合空间' },
  { key: 'gate', label: '门庭视角', desc: '感受门第礼制与进深' },
  { key: 'free', label: '自由漫游', desc: '手动环绕查看细节' },
];

const LIGHTING_META: { key: LightingMode; label: string }[] = [
  { key: 'day', label: '晴昼' },
  { key: 'sunset', label: '暮色' },
  { key: 'night', label: '夜景' },
];

const SEASON_META: Record<SeasonMode, { label: string; altitude: number; note: string }> = {
  spring: { label: '春秋', altitude: 5.8, note: '日照适中，院心活动和厢房采光较均衡。' },
  summer: { label: '夏季', altitude: 8.2, note: '太阳高度较高，屋檐和树荫帮助院落遮阴降温。' },
  autumn: { label: '秋季', altitude: 5.4, note: '光线斜入院落，正房与厢房获得温和采光。' },
  winter: { label: '冬季', altitude: 3.4, note: '低角度阳光更容易照入南向院落和正房前檐。' },
};

const TIME_META: Record<TimeMode, { label: string; x: number; z: number; shadow: [number, number, number] }> = {
  morning: { label: '上午', x: -5.5, z: 3.4, shadow: [1.4, 0, -0.7] },
  noon: { label: '正午', x: 0.4, z: 2.1, shadow: [0, 0, -0.9] },
  afternoon: { label: '下午', x: 5.5, z: 3.4, shadow: [-1.4, 0, -0.7] },
};

const SPACE_ZONES: Record<SpaceKey, {
  name: string;
  role: string;
  desc: string;
  position: [number, number, number];
}> = {
  main: {
    name: '正房',
    role: '长辈居住与家庭核心空间',
    desc: '位于院落北侧、面南而居，是四合院等级最高的位置，采光好、视线统领全院。',
    position: [0, 1.55, -2.35],
  },
  east: {
    name: '东厢房',
    role: '晚辈或家庭成员起居',
    desc: '位于院落东侧，与西厢房共同围合院心，体现家族内部的横向分区。',
    position: [2.45, 1.15, 0],
  },
  west: {
    name: '西厢房',
    role: '晚辈或家庭成员起居',
    desc: '位于院落西侧，与东厢房对称，形成稳定的院落边界和生活秩序。',
    position: [-2.45, 1.15, 0],
  },
  gate: {
    name: '倒座与院门',
    role: '外向接待、门第界面',
    desc: '靠近入口，承担会客、门房或外向服务功能，是内外空间转换的第一层界面。',
    position: [0, 1.05, 2.55],
  },
  screen: {
    name: '影壁',
    role: '遮挡视线与组织动线',
    desc: '入门后遮挡直视院内的视线，使动线发生转折，增强私密性和礼仪感。',
    position: [0.95, 1.0, 2.0],
  },
};

function SiheyuanModel({ autoRotate }: { autoRotate: boolean }) {
  const groupRef = useRef<THREE.Group | null>(null);
  const { scene } = useGLTF(SIHEYUAN_MODEL_PATH, true);
  const modelScene = useMemo(() => {
    const clonedScene = scene.clone(true);
    const sourceToClone = new Map<THREE.Object3D, THREE.Object3D>();
    scene.traverse((source) => {
      const clone = clonedScene.getObjectByProperty('uuid', source.uuid);
      if (clone) {
        sourceToClone.set(source, clone);
      }
    });
    sourceToClone.forEach((clone, source) => {
      if (source instanceof THREE.Mesh && clone instanceof THREE.Mesh) {
        clone.geometry = source.geometry;
        clone.material = Array.isArray(source.material)
          ? source.material.map((material) => material.clone())
          : source.material.clone();
      }
    });
    return clonedScene;
  }, [scene]);

  useEffect(() => {
    if (!modelScene) {
      return;
    }

    modelScene.position.set(0, 0, 0);
    modelScene.rotation.set(0, 0, 0);
    modelScene.scale.set(1, 1, 1);

    const box = new THREE.Box3().setFromObject(modelScene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 4.2 / maxDim;
    modelScene.scale.setScalar(scale);
    modelScene.position.set(-center.x * scale, -box.min.y * scale + 0.1, -center.z * scale);
    modelScene.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) {
        return;
      }
      child.castShadow = true;
      child.receiveShadow = true;
      const material = child.material;
      const materials = Array.isArray(material) ? material : [material];
      materials.forEach((mat) => {
        if (mat instanceof THREE.MeshStandardMaterial) {
          mat.transparent = false;
          mat.opacity = 1;
          mat.side = THREE.DoubleSide;
          mat.roughness = Math.min(0.95, Math.max(0.35, mat.roughness));
          mat.metalness = Math.min(0.2, mat.metalness);
          if (mat.color.getHex() === 0x000000) {
            mat.color.set('#b88a5a');
          }
          mat.needsUpdate = true;
        }
      });
    });
  }, [modelScene]);

  useFrame((_, delta) => {
    if (autoRotate && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.18;
    }
  });

  return (
    <group ref={(node) => {
      groupRef.current = node;
    }}>
      <primitive object={modelScene} />
    </group>
  );
}

function CourtyardFallbackModel() {
  const wood = '#8A5A35';
  const wall = '#D8C7A6';
  const roof = '#4B5563';
  const floor = '#C2A878';

  const HouseBlock = ({
    position,
    size,
    label,
  }: {
    position: [number, number, number];
    size: [number, number, number];
    label: string;
  }) => (
    <group position={position}>
      <mesh position={[0, size[1] / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial color={wall} roughness={0.82} />
      </mesh>
      <mesh position={[0, size[1] + 0.18, 0]} castShadow>
        <boxGeometry args={[size[0] + 0.22, 0.18, size[2] + 0.38]} />
        <meshStandardMaterial color={roof} roughness={0.7} />
      </mesh>
      <mesh position={[0, size[1] + 0.32, 0]} rotation={[0, 0, Math.PI / 4]} castShadow>
        <boxGeometry args={[size[0] * 0.72, 0.18, size[2] + 0.52]} />
        <meshStandardMaterial color={roof} roughness={0.7} />
      </mesh>
      <Html position={[0, size[1] + 0.62, 0]} center distanceFactor={9}>
        <div className="rounded border border-imperial-gold/30 bg-black/70 px-2 py-1 text-[10px] text-imperial-gold whitespace-nowrap">
          {label}
        </div>
      </Html>
    </group>
  );

  return (
    <group>
      <mesh position={[0, 0.035, 0]} receiveShadow>
        <boxGeometry args={[4.2, 0.07, 4.2]} />
        <meshBasicMaterial color={floor} />
      </mesh>
      <HouseBlock position={[0, 0, -2.35]} size={[3.8, 0.78, 0.82]} label="正房" />
      <HouseBlock position={[-2.35, 0, 0]} size={[0.82, 0.62, 3.2]} label="西厢房" />
      <HouseBlock position={[2.35, 0, 0]} size={[0.82, 0.62, 3.2]} label="东厢房" />
      <HouseBlock position={[0, 0, 2.35]} size={[3.4, 0.56, 0.72]} label="倒座房" />
      <mesh position={[0.75, 0.32, 1.55]} castShadow receiveShadow>
        <boxGeometry args={[1.1, 0.64, 0.12]} />
        <meshStandardMaterial color={wall} roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.85, 0.9, 72]} />
        <meshStandardMaterial color="#6B8F47" roughness={0.9} />
      </mesh>
      {[-1.55, 1.55].map((x) => (
        <mesh key={x} position={[x, 0.34, -1.55]} castShadow>
          <cylinderGeometry args={[0.07, 0.09, 0.68, 12]} />
          <meshStandardMaterial color={wood} roughness={0.75} />
        </mesh>
      ))}
    </group>
  );
}

function CourtyardVisualModel({
  selectedSpace,
  onSelectSpace,
  season,
  timeOfDay,
  windMode,
  showSunStudy,
  showVentilation,
}: {
  selectedSpace: SpaceKey;
  onSelectSpace: (space: SpaceKey) => void;
  season: SeasonMode;
  timeOfDay: TimeMode;
  windMode: WindMode;
  showSunStudy: boolean;
  showVentilation: boolean;
}) {
  const blockClass = (space: SpaceKey) =>
    `absolute rounded-[4px] border transition-all duration-300 pointer-events-auto ${
      selectedSpace === space
        ? 'border-imperial-gold bg-[#d8bd74] shadow-[0_0_24px_rgba(197,165,90,0.35)]'
        : 'border-imperial-gold/35 bg-[#a9794c] hover:border-imperial-gold hover:bg-[#bd8a56]'
    }`;
  const roofClass = 'absolute inset-x-[-8px] -top-5 h-7 rounded-t-[6px] bg-[#38404f] shadow-lg';
  const sunOffset = {
    morning: 'left-[18%] top-[18%]',
    noon: 'left-[48%] top-[10%]',
    afternoon: 'left-[76%] top-[18%]',
  }[timeOfDay];
  const shadowClass = season === 'summer' ? 'h-16 opacity-20' : season === 'winter' ? 'h-36 opacity-35' : 'h-24 opacity-28';

  return (
    <div className="absolute inset-0 z-[4] pointer-events-none overflow-hidden">
      <div className="absolute inset-8 md:inset-14 rounded-xl border border-imperial-gold/15 bg-[radial-gradient(circle_at_center,rgba(197,165,90,0.10),rgba(10,10,15,0.05)_52%,rgba(0,0,0,0.18))]">
        {showSunStudy && (
          <>
            <div className={`absolute ${sunOffset} h-8 w-8 rounded-full bg-[#ffd56a] shadow-[0_0_34px_rgba(255,213,106,0.75)]`} />
            <div className={`absolute left-[33%] top-[42%] w-[34%] ${shadowClass} rotate-[-12deg] rounded-full bg-black/60 blur-xl`} />
          </>
        )}

        <button type="button" aria-label="正房" onClick={() => onSelectSpace('main')} className={`${blockClass('main')} left-[24%] top-[10%] h-[16%] w-[52%]`}>
          <span className={roofClass} />
          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-imperial-dark">正房</span>
        </button>
        <button type="button" aria-label="西厢房" onClick={() => onSelectSpace('west')} className={`${blockClass('west')} left-[8%] top-[31%] h-[44%] w-[15%]`}>
          <span className={roofClass} />
          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-imperial-dark [writing-mode:vertical-rl]">西厢房</span>
        </button>
        <button type="button" aria-label="东厢房" onClick={() => onSelectSpace('east')} className={`${blockClass('east')} right-[8%] top-[31%] h-[44%] w-[15%]`}>
          <span className={roofClass} />
          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-imperial-dark [writing-mode:vertical-rl]">东厢房</span>
        </button>
        <button type="button" aria-label="倒座与院门" onClick={() => onSelectSpace('gate')} className={`${blockClass('gate')} left-[27%] bottom-[8%] h-[14%] w-[46%]`}>
          <span className={roofClass} />
          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-imperial-dark">倒座与院门</span>
        </button>
        <button type="button" aria-label="影壁" onClick={() => onSelectSpace('screen')} className={`${blockClass('screen')} left-[43%] bottom-[27%] h-[8%] w-[14%]`}>
          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-imperial-dark">影壁</span>
        </button>

        <div className="absolute left-[30%] top-[31%] h-[40%] w-[40%] rounded-full border border-imperial-gold/25 bg-[#bfa56a]/20 shadow-inner">
          <div className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#6f8f45] bg-[#426b38]/80" />
          <div className="absolute left-1/2 top-1/2 h-[1px] w-[74%] -translate-x-1/2 bg-imperial-gold/25" />
          <div className="absolute left-1/2 top-1/2 h-[74%] w-[1px] -translate-y-1/2 bg-imperial-gold/25" />
        </div>

        {showVentilation && (
          <div className={`absolute left-[23%] h-10 w-[54%] rounded-full border border-cyan-300/20 bg-cyan-300/10 blur-[1px] ${
            windMode === 'south' ? 'bottom-[22%]' : 'top-[27%]'
          }`}>
            <div className={`absolute top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-cyan-200 shadow-[0_0_12px_rgba(125,211,252,0.9)] ${
              windMode === 'south' ? 'animate-[pulse_1.5s_ease-in-out_infinite] left-[12%]' : 'animate-[pulse_1.5s_ease-in-out_infinite] right-[12%]'
            }`} />
          </div>
        )}

        <div className="absolute bottom-4 left-4 rounded border border-imperial-gold/20 bg-black/45 px-3 py-2 text-[10px] text-imperial-gold/80">
          {SEASON_META[season].label} · {TIME_META[timeOfDay].label} · {windMode === 'south' ? '南风' : '北风'}
        </div>
      </div>
    </div>
  );
}

function ThreeCourtyardModel() {
  const HouseBlock = ({
    position,
    size,
    color,
  }: {
    position: [number, number, number];
    size: [number, number, number];
    color: string;
  }) => (
    <group position={position}>
      <mesh position={[0, size[1] / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial color={color} roughness={0.78} />
      </mesh>
      <mesh position={[0, size[1] + 0.16, 0]} castShadow>
        <boxGeometry args={[size[0] + 0.24, 0.18, size[2] + 0.38]} />
        <meshStandardMaterial color="#3e4655" roughness={0.68} />
      </mesh>
    </group>
  );

  return (
    <group position={[0, 0.1, 0]} rotation={[0, -0.25, 0]}>
      <mesh position={[0, 0, 0]} receiveShadow>
        <boxGeometry args={[4.6, 0.08, 4.6]} />
        <meshStandardMaterial color="#bfa56a" roughness={0.9} />
      </mesh>
      <HouseBlock position={[0, 0.02, -2.15]} size={[3.9, 0.72, 0.72]} color="#d6bd72" />
      <HouseBlock position={[-2.15, 0.02, 0]} size={[0.72, 0.62, 3.3]} color="#b7824f" />
      <HouseBlock position={[2.15, 0.02, 0]} size={[0.72, 0.62, 3.3]} color="#b7824f" />
      <HouseBlock position={[0, 0.02, 2.15]} size={[3.45, 0.56, 0.68]} color="#b9854f" />
      <mesh position={[0.72, 0.34, 1.34]} castShadow receiveShadow>
        <boxGeometry args={[1.15, 0.68, 0.14]} />
        <meshStandardMaterial color="#d8c7a6" roughness={0.82} />
      </mesh>
      <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[1.05, 64]} />
        <meshStandardMaterial color="#5e5138" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.16, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.24, 0.32, 24]} />
        <meshStandardMaterial color="#47733a" roughness={0.8} />
      </mesh>
    </group>
  );
}

function CameraRig({ viewMode }: { viewMode: CourtyardViewMode }) {
  const { camera } = useThree();

  useFrame(() => {
    const targets: Record<CourtyardViewMode, THREE.Vector3> = {
      overview: new THREE.Vector3(6.8, 5.6, 7.2),
      courtyard: new THREE.Vector3(0.2, 3.2, 5.4),
      gate: new THREE.Vector3(0.4, 2.3, 8.4),
      free: camera.position.clone(),
    };

    if (viewMode !== 'free') {
      camera.position.lerp(targets[viewMode], 0.06);
      camera.lookAt(0, 1.4, 0);
    }
  });

  return null;
}

function SunStudyLayer({
  season,
  timeOfDay,
  enabled,
}: {
  season: SeasonMode;
  timeOfDay: TimeMode;
  enabled: boolean;
}) {
  const seasonInfo = SEASON_META[season];
  const timeInfo = TIME_META[timeOfDay];
  const sunPosition: [number, number, number] = [timeInfo.x, seasonInfo.altitude, timeInfo.z];

  if (!enabled) {
    return null;
  }

  return (
    <group>
      <directionalLight
        position={sunPosition}
        intensity={1.05}
        color="#fff1bc"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <mesh position={sunPosition}>
        <sphereGeometry args={[0.18, 24, 24]} />
        <meshBasicMaterial color="#FFD56A" />
      </mesh>
      <mesh position={[timeInfo.shadow[0], 0.025, timeInfo.shadow[2]]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[4.4, season === 'summer' ? 2.1 : season === 'winter' ? 4.8 : 3.4]} />
        <meshBasicMaterial color="#1f2937" transparent opacity={season === 'summer' ? 0.16 : 0.28} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0.035, -0.35]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.05, 1.09, 72]} />
        <meshBasicMaterial color="#FFD56A" transparent opacity={0.5} />
      </mesh>
      <Html position={[sunPosition[0], sunPosition[1] + 0.35, sunPosition[2]]} center distanceFactor={9}>
        <div className="rounded border border-yellow-400/40 bg-black/70 px-2 py-1 text-[10px] text-yellow-200 whitespace-nowrap">
          {seasonInfo.label} · {timeInfo.label}
        </div>
      </Html>
    </group>
  );
}

function VentilationLayer({
  windMode,
  enabled,
}: {
  windMode: WindMode;
  enabled: boolean;
}) {
  const particles = useMemo(
    () => Array.from({ length: 22 }, (_, i) => ({
      x: ((i % 6) - 2.5) * 0.62,
      offset: i * 0.19,
      y: 0.42 + (i % 4) * 0.16,
    })),
    [],
  );
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current || !enabled) {
      return;
    }
    groupRef.current.children.forEach((child, index) => {
      const particle = particles[index];
      const direction = windMode === 'south' ? -1 : 1;
      const t = (state.clock.elapsedTime * 0.28 + particle.offset) % 1;
      child.position.set(particle.x + Math.sin(t * Math.PI * 2 + index) * 0.18, particle.y, direction * (3.0 - t * 6.0));
    });
  });

  if (!enabled) {
    return null;
  }

  return (
    <group ref={groupRef}>
      {particles.map((particle, index) => (
        <mesh key={index} position={[particle.x, particle.y, 0]}>
          <sphereGeometry args={[0.035, 10, 10]} />
          <meshBasicMaterial color={windMode === 'south' ? '#7DD3FC' : '#A7F3D0'} transparent opacity={0.72} />
        </mesh>
      ))}
      <Html position={[0, 1.8, windMode === 'south' ? 2.75 : -2.75]} center distanceFactor={8}>
        <div className="rounded border border-cyan-300/30 bg-black/70 px-2 py-1 text-[10px] text-cyan-200 whitespace-nowrap">
          {windMode === 'south' ? '夏季南风入院' : '冬季北风受围合削弱'}
        </div>
      </Html>
    </group>
  );
}

function SpaceMarkers({
  selectedSpace,
  showHierarchy,
  onSelect,
}: {
  selectedSpace: SpaceKey;
  showHierarchy: boolean;
  onSelect: (space: SpaceKey) => void;
}) {
  if (!showHierarchy) {
    return null;
  }

  return (
    <group>
      {(Object.entries(SPACE_ZONES) as [SpaceKey, typeof SPACE_ZONES[SpaceKey]][]).map(([key, zone]) => (
        <Html key={key} position={zone.position} center distanceFactor={8}>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onSelect(key);
            }}
            className={`rounded border px-2 py-1 text-[10px] whitespace-nowrap transition-all ${
              selectedSpace === key
                ? 'border-imperial-gold bg-imperial-gold text-imperial-dark font-bold'
                : 'border-imperial-gold/30 bg-black/70 text-imperial-gold hover:bg-imperial-gold/15'
            }`}
          >
            {zone.name}
          </button>
        </Html>
      ))}
    </group>
  );
}

function SiheyuanScene({
  viewMode,
  lightingMode,
  autoRotate,
  season,
  timeOfDay,
  windMode,
  showSunStudy,
  showVentilation,
  showHierarchy,
  selectedSpace,
  onSelectSpace,
}: {
  viewMode: CourtyardViewMode;
  lightingMode: LightingMode;
  autoRotate: boolean;
  season: SeasonMode;
  timeOfDay: TimeMode;
  windMode: WindMode;
  showSunStudy: boolean;
  showVentilation: boolean;
  showHierarchy: boolean;
  selectedSpace: SpaceKey;
  onSelectSpace: (space: SpaceKey) => void;
}) {
  const lighting = {
    day: {
      background: '#d9e7f5',
      fog: '#d9e7f5',
      ambient: 0.95,
      sun: '#fff0cc',
      sunIntensity: 1.5,
      fill: '#e7f0ff',
      fillIntensity: 0.45,
      point: '#ffddaa',
      pointIntensity: 0.35,
    },
    sunset: {
      background: '#2b2020',
      fog: '#2b2020',
      ambient: 0.65,
      sun: '#ffbf7c',
      sunIntensity: 1.3,
      fill: '#6d7fa8',
      fillIntensity: 0.35,
      point: '#ffb46a',
      pointIntensity: 0.5,
    },
    night: {
      background: '#0f1726',
      fog: '#0f1726',
      ambient: 0.34,
      sun: '#9ab7ff',
      sunIntensity: 0.9,
      fill: '#33507f',
      fillIntensity: 0.25,
      point: '#ffd38a',
      pointIntensity: 0.7,
    },
  }[lightingMode];

  return (
    <>
      <color attach="background" args={[lighting.background]} />
      <ambientLight intensity={1.05} color="#ffffff" />
      <directionalLight position={[8, 10, 6]} intensity={1.45} color={lighting.sun} castShadow />
      <directionalLight position={[-6, 5, -8]} intensity={0.55} color={lighting.fill} />
      <pointLight position={[0, 3.2, 0]} intensity={lighting.pointIntensity} color={lighting.point} distance={12} />
      <SunStudyLayer season={season} timeOfDay={timeOfDay} enabled={showSunStudy} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[22, 22]} />
        <meshStandardMaterial color="#5a4632" roughness={0.95} />
      </mesh>
      <CourtyardFallbackModel />
      <VentilationLayer windMode={windMode} enabled={showVentilation} />
      <SpaceMarkers selectedSpace={selectedSpace} showHierarchy={showHierarchy} onSelect={onSelectSpace} />
      <OrbitControls
        enablePan
        enableZoom
        target={[0, 0.9, 0]}
        minDistance={3.5}
        maxDistance={16}
        autoRotate={autoRotate && viewMode === 'free'}
        autoRotateSpeed={0.35}
        maxPolarAngle={Math.PI / 2.05}
      />
    </>
  );
}

function SiheyuanOriginalScene({
  viewMode,
  lightingMode,
  autoRotate,
}: {
  viewMode: CourtyardViewMode;
  lightingMode: LightingMode;
  autoRotate: boolean;
}) {
  const lighting = {
    day: {
      background: '#d9e7f5',
      fog: '#d9e7f5',
      ambient: 0.95,
      sun: '#fff0cc',
      sunIntensity: 1.5,
      fill: '#e7f0ff',
      fillIntensity: 0.45,
      point: '#ffddaa',
      pointIntensity: 0.35,
    },
    sunset: {
      background: '#2b2020',
      fog: '#2b2020',
      ambient: 0.65,
      sun: '#ffbf7c',
      sunIntensity: 1.3,
      fill: '#6d7fa8',
      fillIntensity: 0.35,
      point: '#ffb46a',
      pointIntensity: 0.5,
    },
    night: {
      background: '#0f1726',
      fog: '#0f1726',
      ambient: 0.34,
      sun: '#9ab7ff',
      sunIntensity: 0.9,
      fill: '#33507f',
      fillIntensity: 0.25,
      point: '#ffd38a',
      pointIntensity: 0.7,
    },
  }[lightingMode];

  return (
    <>
      <CameraRig viewMode={viewMode} />
      <color attach="background" args={[lighting.background]} />
      <fog attach="fog" args={[lighting.fog, 12, 24]} />
      <ambientLight intensity={lighting.ambient} color={lighting.sun} />
      <directionalLight position={[8, 10, 6]} intensity={lighting.sunIntensity} color={lighting.sun} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
      <directionalLight position={[-6, 5, -8]} intensity={lighting.fillIntensity} color={lighting.fill} />
      <pointLight position={[0, 3.2, 0]} intensity={lighting.pointIntensity} color={lighting.point} distance={12} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[22, 22]} />
        <meshStandardMaterial color="#5a4632" roughness={0.95} />
      </mesh>
      <Suspense fallback={<Html center><div className="text-imperial-gold text-sm animate-pulse">加载四合院模型中...</div></Html>}>
        <SiheyuanModel autoRotate={autoRotate && viewMode !== 'free'} />
      </Suspense>
      <ContactShadows position={[0, 0.02, 0]} opacity={0.45} scale={18} blur={2.6} far={8} />
      <OrbitControls
        enablePan
        enableZoom
        minDistance={3.5}
        maxDistance={16}
        autoRotate={autoRotate && viewMode === 'free'}
        autoRotateSpeed={0.35}
        maxPolarAngle={Math.PI / 2.05}
      />
    </>
  );
}

function SiheyuanPage() {
  const [viewMode, setViewMode] = useState<CourtyardViewMode>('overview');
  const [lightingMode, setLightingMode] = useState<LightingMode>('day');
  const [displayMode, setDisplayMode] = useState<DisplayMode>('2d');
  const [autoRotate, setAutoRotate] = useState(true);
  const [season, setSeason] = useState<SeasonMode>('winter');
  const [timeOfDay, setTimeOfDay] = useState<TimeMode>('noon');
  const [windMode, setWindMode] = useState<WindMode>('south');
  const [showSunStudy, setShowSunStudy] = useState(true);
  const [showVentilation, setShowVentilation] = useState(true);
  const [showHierarchy, setShowHierarchy] = useState(true);
  const [selectedSpace, setSelectedSpace] = useState<SpaceKey>('main');

  const selectedZone = SPACE_ZONES[selectedSpace];

  return (
    <div className="min-h-screen ink-bg">
      <div className="text-center pt-8 pb-4 px-4">
        <h1 className="text-3xl md:text-4xl font-bold text-imperial-gold tracking-wider">四合院</h1>
        <p className="text-gray-500 text-sm mt-2 tracking-widest">门庭礼序 · 院落围合 · 中轴空间 · 家族居住智慧</p>
        <div className="chinese-divider max-w-xs mx-auto mt-4" />
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-[500px] md:h-[620px] gold-border rounded-lg overflow-hidden bg-imperial-deeper/50 relative">
            <div className="absolute top-3 left-3 z-10 rounded-lg border border-imperial-gold/20 bg-black/40 px-3 py-2 backdrop-blur-sm">
              <p className="text-[11px] tracking-widest text-imperial-gold">2d27ecb8-fc0f-4df1-8d44-ea4b7d800d06</p>
            </div>
            <div className="absolute top-3 right-3 z-20 flex gap-1 rounded-lg border border-imperial-gold/20 bg-black/50 p-1 backdrop-blur-sm">
              {([
                ['2d', '2D展示'],
                ['3d', '3D展示'],
              ] as [DisplayMode, string][]).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setDisplayMode(key)}
                  className={`rounded px-3 py-1.5 text-[11px] tracking-wider transition-all ${
                    displayMode === key
                      ? 'bg-imperial-gold text-imperial-dark font-bold'
                      : 'text-imperial-gold hover:bg-imperial-gold/10'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {displayMode === '2d' ? (
              <CourtyardVisualModel
                selectedSpace={selectedSpace}
                onSelectSpace={setSelectedSpace}
                season={season}
                timeOfDay={timeOfDay}
                windMode={windMode}
                showSunStudy={showSunStudy}
                showVentilation={showVentilation}
              />
            ) : (
              <Canvas camera={{ position: [6.8, 5.6, 7.2], fov: 40 }} shadows>
                <SiheyuanOriginalScene viewMode={viewMode} lightingMode={lightingMode} autoRotate={autoRotate} />
              </Canvas>
            )}
          </div>

          <div className="space-y-4">
            <div className="gold-border rounded-lg p-4 bg-imperial-deeper/50">
              <h3 className="text-imperial-gold text-sm font-bold tracking-wider mb-3">📷 视角模式</h3>
              <div className="grid grid-cols-2 gap-2">
                {VIEW_MODE_META.map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setViewMode(item.key)}
                    className={`px-3 py-2 rounded text-xs tracking-wider transition-all ${
                      viewMode === item.key
                        ? 'bg-imperial-gold text-imperial-dark font-bold'
                        : 'border border-imperial-gold/40 text-imperial-gold hover:bg-imperial-gold/10'
                    }`}
                    title={item.desc}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="gold-border rounded-lg p-4 bg-imperial-deeper/50">
              <h3 className="text-imperial-gold text-sm font-bold tracking-wider mb-3">🌤 氛围光照</h3>
              <div className="flex flex-wrap gap-2">
                {LIGHTING_META.map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setLightingMode(item.key)}
                    className={`px-4 py-2 rounded text-xs tracking-wider transition-all ${
                      lightingMode === item.key
                        ? 'bg-imperial-gold text-imperial-dark font-bold'
                        : 'border border-imperial-gold/40 text-imperial-gold hover:bg-imperial-gold/10'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setAutoRotate((current) => !current)}
                className={`mt-3 w-full px-4 py-2 rounded text-xs tracking-wider transition-all ${
                  autoRotate
                    ? 'bg-imperial-gold/15 text-imperial-gold border border-imperial-gold/30'
                    : 'border border-gray-700 text-gray-500 hover:text-gray-300'
                }`}
              >
                {autoRotate ? '已开启自动旋转' : '已关闭自动旋转'}
              </button>
            </div>

            <div className="gold-border rounded-lg p-4 bg-imperial-deeper/50">
              <div className="flex items-center justify-between gap-3 mb-3">
                <h3 className="text-imperial-gold text-sm font-bold tracking-wider">☀️ 日照轨迹</h3>
                <button
                  onClick={() => setShowSunStudy((current) => !current)}
                  className={`px-2 py-1 rounded text-[10px] ${
                    showSunStudy ? 'bg-imperial-gold text-imperial-dark font-bold' : 'border border-gray-700 text-gray-500'
                  }`}
                >
                  {showSunStudy ? 'ON' : 'OFF'}
                </button>
              </div>
              <div className="grid grid-cols-4 gap-1.5 mb-2">
                {(Object.entries(SEASON_META) as [SeasonMode, typeof SEASON_META[SeasonMode]][]).map(([key, item]) => (
                  <button
                    key={key}
                    onClick={() => setSeason(key)}
                    className={`py-1.5 rounded text-[11px] transition-all ${
                      season === key
                        ? 'bg-imperial-gold/15 text-imperial-gold border border-imperial-gold/30'
                        : 'border border-gray-700 text-gray-500 hover:text-imperial-gold'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-1.5 mb-3">
                {(Object.entries(TIME_META) as [TimeMode, typeof TIME_META[TimeMode]][]).map(([key, item]) => (
                  <button
                    key={key}
                    onClick={() => setTimeOfDay(key)}
                    className={`py-1.5 rounded text-[11px] transition-all ${
                      timeOfDay === key
                        ? 'bg-yellow-500/15 text-yellow-300 border border-yellow-500/30'
                        : 'border border-gray-700 text-gray-500 hover:text-yellow-300'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">{SEASON_META[season].note}</p>
            </div>

            <div className="gold-border rounded-lg p-4 bg-imperial-deeper/50">
              <div className="flex items-center justify-between gap-3 mb-3">
                <h3 className="text-imperial-gold text-sm font-bold tracking-wider">🌬 通风路径</h3>
                <button
                  onClick={() => setShowVentilation((current) => !current)}
                  className={`px-2 py-1 rounded text-[10px] ${
                    showVentilation ? 'bg-imperial-gold text-imperial-dark font-bold' : 'border border-gray-700 text-gray-500'
                  }`}
                >
                  {showVentilation ? 'ON' : 'OFF'}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {([
                  ['south', '夏季南风', '气流穿过门庭进入院心，带走热量。'],
                  ['north', '冬季北风', '围合院墙与房屋削弱冷风直冲。'],
                ] as [WindMode, string, string][]).map(([key, label, desc]) => (
                  <button
                    key={key}
                    onClick={() => setWindMode(key)}
                    className={`px-3 py-2 rounded text-xs text-left transition-all ${
                      windMode === key
                        ? 'bg-cyan-500/15 text-cyan-200 border border-cyan-400/30'
                        : 'border border-gray-700 text-gray-500 hover:text-cyan-200'
                    }`}
                    title={desc}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                粒子流线展示院门、院心与厢房之间的空气交换，用于说明四合院通过围合与开口组织自然通风和避风。
              </p>
            </div>

            <div className="gold-border rounded-lg p-4 bg-imperial-deeper/50 min-h-[140px]">
              <h3 className="text-imperial-gold text-sm font-bold tracking-wider mb-3">🏡 空间解读</h3>
              <div className="space-y-2 text-sm text-gray-400 leading-relaxed">
                <p>
                  四合院是中国传统居住建筑最具代表性的院落类型，以中轴秩序组织正房、厢房与倒座，形成内向围合、层层递进的生活空间。
                </p>
                <p>
                  这类住宅不仅强调采光、通风与私密性，也通过门庭、影壁、院心和屋顶尺度体现礼制与家族关系。
                </p>
              </div>
            </div>

            <div className="gold-border rounded-lg p-4 bg-imperial-deeper/50">
              <div className="flex items-center justify-between gap-3 mb-3">
                <h3 className="text-imperial-gold text-sm font-bold tracking-wider">👪 家庭等级空间</h3>
                <button
                  onClick={() => setShowHierarchy((current) => !current)}
                  className={`px-2 py-1 rounded text-[10px] ${
                    showHierarchy ? 'bg-imperial-gold text-imperial-dark font-bold' : 'border border-gray-700 text-gray-500'
                  }`}
                >
                  {showHierarchy ? 'ON' : 'OFF'}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {(Object.entries(SPACE_ZONES) as [SpaceKey, typeof SPACE_ZONES[SpaceKey]][]).map(([key, zone]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedSpace(key)}
                    className={`px-3 py-2 rounded text-xs text-left transition-all ${
                      selectedSpace === key
                        ? 'bg-imperial-gold/15 text-imperial-gold border border-imperial-gold/30'
                        : 'border border-gray-700 text-gray-500 hover:text-imperial-gold'
                    }`}
                  >
                    {zone.name}
                  </button>
                ))}
              </div>
              <div className="rounded border border-imperial-gold/10 bg-black/20 px-3 py-2">
                <p className="text-imperial-gold text-xs font-bold">{selectedZone.role}</p>
                <p className="text-xs text-gray-400 leading-relaxed mt-1">{selectedZone.desc}</p>
              </div>
            </div>

            <div className="gold-border rounded-lg p-4 bg-imperial-deeper/50">
              <h3 className="text-imperial-gold text-sm font-bold tracking-wider mb-3">📚 建筑特征</h3>
              <div className="space-y-2 text-xs text-gray-400 leading-relaxed">
                <p><span className="text-imperial-gold">院落围合：</span>以中心庭院为核心组织居住、会客与礼仪活动。</p>
                <p><span className="text-imperial-gold">轴线秩序：</span>正房居中，厢房分列两侧，形成清晰主次关系。</p>
                <p><span className="text-imperial-gold">门第礼序：</span>门庭、影壁与进院路径共同构成入户仪式感。</p>
                <p><span className="text-imperial-gold">宜居智慧：</span>屋檐、回廊与天井共同调节日照、雨水与通风。</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SiheyuanPage;
