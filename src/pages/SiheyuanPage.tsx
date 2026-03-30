import { Suspense, useEffect, useMemo, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, Html, OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

type CourtyardViewMode = 'overview' | 'courtyard' | 'gate' | 'free';
type LightingMode = 'day' | 'sunset' | 'night';

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

function SiheyuanModel({ autoRotate }: { autoRotate: boolean }) {
  const groupRef = useMemo(() => ({ current: null as THREE.Group | null }), []);
  const { scene } = useGLTF(SIHEYUAN_MODEL_PATH, true);

  useEffect(() => {
    if (!scene) {
      return;
    }
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 4.2 / maxDim;
    scene.scale.setScalar(scale);
    scene.position.set(-center.x * scale, -box.min.y * scale + 0.1, -center.z * scale);
    scene.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) {
        return;
      }
      child.castShadow = true;
      child.receiveShadow = true;
      const material = child.material;
      const materials = Array.isArray(material) ? material : [material];
      materials.forEach((mat) => {
        if (mat instanceof THREE.MeshStandardMaterial) {
          mat.roughness = Math.min(0.95, Math.max(0.35, mat.roughness));
          mat.metalness = Math.min(0.2, mat.metalness);
        }
      });
    });
  }, [scene]);

  useFrame((_, delta) => {
    if (autoRotate && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.18;
    }
  });

  return (
    <group ref={(node) => {
      groupRef.current = node;
    }}>
      <primitive object={scene} />
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

function SiheyuanScene({
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
  const [autoRotate, setAutoRotate] = useState(true);

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
            <Canvas camera={{ position: [6.8, 5.6, 7.2], fov: 40 }} shadows>
              <SiheyuanScene viewMode={viewMode} lightingMode={lightingMode} autoRotate={autoRotate} />
            </Canvas>
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
