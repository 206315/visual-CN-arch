import { useRef, useState, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Html } from '@react-three/drei';
import ReactEChartsCore from 'echarts-for-react';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, TitleComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import * as THREE from 'three';

echarts.use([LineChart, GridComponent, TooltipComponent, TitleComponent, LegendComponent, CanvasRenderer]);

/* ==========================================================================
   榫卯节点力学原理
   参考：《中国古代建筑木结构力学》、《榫卯节点抗震性能研究》
   ========================================================================== */

const SUNMAO_INFO = {
  name: '榫卯节点',
  type: '半刚性阻尼器',
  stiffness: '介于铰接与刚接之间',
  damping: '通过木材纤维挤压变形耗散能量',
  advantage: '地震时可转动，消耗动能，保护主体结构',
};

/* 模拟模式 */
type SimulationMode = 'static' | 'vertical' | 'horizontal' | 'rotation';

/* ========== 榫卯3D模型组件 ========== */
function SunmaoModel({ mode, time }: { mode: SimulationMode; time: number }) {
  const groupRef = useRef<THREE.Group>(null);
  
  /* 根据模式计算变形 */
  const deformation = useMemo(() => {
    switch (mode) {
      case 'vertical':
        return { y: -Math.sin(time * 2) * 0.08, rotation: 0 };
      case 'horizontal':
        return { y: 0, rotation: Math.sin(time * 3) * 0.15 };
      case 'rotation':
        return { y: 0, rotation: Math.sin(time * 2.5) * 0.25 };
      default:
        return { y: 0, rotation: 0 };
    }
  }, [mode, time]);
  
  return (
    <group ref={groupRef}>
      {/* 卯口（母构件，固定） */}
      <group position={[0, 0, 0]}>
        {/* 卯口主体 */}
        <mesh position={[0, 0, 0]} receiveShadow>
          <boxGeometry args={[2.5, 1.2, 1.5]} />
          <meshStandardMaterial color="#A0522D" roughness={0.75} metalness={0.08} />
        </mesh>
        
        {/* 卯口凹槽（上部） */}
        <mesh position={[0, 0.3, 0.5]}>
          <boxGeometry args={[0.8, 0.6, 0.6]} />
          <meshStandardMaterial color="#8B4513" roughness={0.8} />
        </mesh>
        
        {/* 卯口标签 */}
        <Html position={[0, -0.8, 0]} center>
          <div className="bg-imperial-deeper/90 text-imperial-gold px-2 py-1 rounded text-xs border border-imperial-gold/30">
            卯口（母构件）
          </div>
        </Html>
      </group>
      
      {/* 榫头（子构件，可变形） */}
      <group 
        position={[0, 1.2 + deformation.y, 0]}
        rotation={[0, 0, deformation.rotation]}
      >
        {/* 榫头主体 */}
        <mesh position={[0, 0.4, 0]} castShadow>
          <boxGeometry args={[2.0, 0.8, 1.2]} />
          <meshStandardMaterial 
            color={mode === 'static' ? '#B8860B' : '#DAA520'} 
            roughness={0.7} 
            metalness={0.1}
            emissive={mode !== 'static' ? '#DAA520' : '#000000'}
            emissiveIntensity={mode !== 'static' ? 0.15 : 0}
          />
        </mesh>
        
        {/* 榫头凸起（插入卯口） */}
        <mesh position={[0, 0, 0.35]} castShadow>
          <boxGeometry args={[0.75, 0.55, 0.5]} />
          <meshStandardMaterial color="#C5A55A" roughness={0.75} />
        </mesh>
        
        {/* 榫头标签 */}
        <Html position={[0, 1.0, 0]} center>
          <div className="bg-imperial-deeper/90 text-imperial-gold px-2 py-1 rounded text-xs border border-imperial-gold/30">
            榫头（子构件）
          </div>
        </Html>
      </group>
      
      {/* 力的可视化 */}
      {mode === 'vertical' && (
        <group position={[0, 2.5, 0]}>
          <mesh>
            <coneGeometry args={[0.12, 0.5, 8]} />
            <meshStandardMaterial color="#DC143C" emissive="#DC143C" emissiveIntensity={0.4} />
          </mesh>
          <Html position={[0, 0.5, 0]} center>
            <div className="text-red-500 text-xs font-bold">竖向压力</div>
          </Html>
        </group>
      )}
      
      {mode === 'horizontal' && (
        <group position={[1.5, 1.5, 0]} rotation={[0, 0, -Math.PI / 2]}>
          <mesh>
            <coneGeometry args={[0.12, 0.5, 8]} />
            <meshStandardMaterial color="#1E90FF" emissive="#1E90FF" emissiveIntensity={0.4} />
          </mesh>
          <Html position={[0, 0.5, 0]} center>
            <div className="text-blue-400 text-xs font-bold">水平地震力</div>
          </Html>
        </group>
      )}
      
      {mode === 'rotation' && (
        <>
          {/* 转动弧线指示 */}
          <mesh position={[0, 1.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[1.2, 0.03, 8, 32, Math.PI]} />
            <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={0.3} />
          </mesh>
          <Html position={[0, 2.2, 0]} center>
            <div className="text-yellow-400 text-xs font-bold">转动耗能</div>
          </Html>
        </>
      )}
      
      {/* 地面 */}
      <mesh position={[0, -1.2, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[8, 8]} />
        <meshStandardMaterial color="#1A1A15" roughness={1} />
      </mesh>
    </group>
  );
}

/* ========== 动画场景 ========== */
function SunmaoScene({ mode }: { mode: SimulationMode }) {
  const [time, setTime] = useState(0);
  
  useFrame((state, delta) => {
    if (mode !== 'static') {
      setTime((t) => t + delta);
    }
  });
  
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 8, 5]} intensity={1.2} castShadow />
      <directionalLight position={[-3, 5, -3]} intensity={0.4} />
      
      <SunmaoModel mode={mode} time={time} />
      
      <ContactShadows position={[0, -1.21, 0]} opacity={0.4} scale={10} blur={2} />
      <OrbitControls 
        enablePan 
        enableZoom 
        minDistance={3} 
        maxDistance={12}
        maxPolarAngle={Math.PI / 2.2}
      />
      {/* 补光：模拟 Environment 效果（不依赖 CDN） */}
      <hemisphereLight args={['#C5A55A', '#3A2A1A', 0.45]} />
      <pointLight position={[-5, 5, -5]} intensity={0.3} color="#FFEEDD" />
    </>
  );
}

/* ========== 能量耗散曲线图 ========== */
function getEnergyChartOption(mode: SimulationMode) {
  const timeData = Array.from({ length: 50 }, (_, i) => i * 0.1);
  
  const inputEnergy = timeData.map((t) => {
    if (mode === 'static') return 0;
    return 100 * Math.sin(t * 2);
  });
  
  const dissipatedEnergy = timeData.map((t) => {
    if (mode === 'static') return 0;
    const input = 100 * Math.sin(t * 2);
    const damping = mode === 'rotation' ? 0.7 : mode === 'horizontal' ? 0.5 : 0.3;
    return input * damping * (1 - Math.exp(-t * 0.5));
  });
  
  const transmittedEnergy = inputEnergy.map((val, i) => val - dissipatedEnergy[i]);
  
  return {
    backgroundColor: 'transparent',
    title: {
      text: '榫卯节点能量耗散分析',
      left: 'center',
      textStyle: { color: '#FFD700', fontSize: 14 },
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(10, 10, 15, 0.95)',
      borderColor: '#FFD700',
      textStyle: { color: '#E8E8E8' },
    },
    legend: {
      data: ['输入能量', '耗散能量', '传递能量'],
      bottom: 10,
      textStyle: { color: '#999', fontSize: 10 },
    },
    grid: { top: 50, bottom: 50, left: 50, right: 30 },
    xAxis: {
      type: 'category',
      data: timeData.map((t) => t.toFixed(1)),
      name: '时间 (s)',
      nameTextStyle: { color: '#999', fontSize: 10 },
      axisLine: { lineStyle: { color: '#C5A55A40' } },
      axisLabel: { color: '#999', fontSize: 9, interval: 9 },
    },
    yAxis: {
      type: 'value',
      name: '能量 (J)',
      nameTextStyle: { color: '#999', fontSize: 10 },
      axisLine: { lineStyle: { color: '#C5A55A40' } },
      axisLabel: { color: '#999', fontSize: 9 },
      splitLine: { lineStyle: { color: '#ffffff08' } },
    },
    series: [
      {
        name: '输入能量',
        type: 'line',
        data: inputEnergy,
        lineStyle: { color: '#1E90FF', width: 2 },
        itemStyle: { color: '#1E90FF' },
        smooth: true,
      },
      {
        name: '耗散能量',
        type: 'line',
        data: dissipatedEnergy,
        lineStyle: { color: '#DC143C', width: 2 },
        itemStyle: { color: '#DC143C' },
        smooth: true,
        areaStyle: { color: 'rgba(220, 20, 60, 0.15)' },
      },
      {
        name: '传递能量',
        type: 'line',
        data: transmittedEnergy,
        lineStyle: { color: '#32CD32', width: 2 },
        itemStyle: { color: '#32CD32' },
        smooth: true,
      },
    ],
  };
}

/* ========== 榫卯力学页面主组件 ========== */
function SunmaoPage() {
  const [mode, setMode] = useState<SimulationMode>('static');
  
  const modes: { id: SimulationMode; label: string; desc: string; icon: string }[] = [
    { 
      id: 'static', 
      label: '静态', 
      desc: '榫头插入卯口，初始状态无外力', 
      icon: '⏸️' 
    },
    { 
      id: 'vertical', 
      label: '竖向压力', 
      desc: '重力荷载下，榫头压向卯口下壁，通过承压传递压力', 
      icon: '⬇️' 
    },
    { 
      id: 'horizontal', 
      label: '水平地震', 
      desc: '地震水平力作用，节点产生弯矩，榫头在卯口内微小转动', 
      icon: '↔️' 
    },
    { 
      id: 'rotation', 
      label: '转动耗能', 
      desc: '榫头转动挤压木材纤维，将动能转化为热能耗散，起到阻尼器作用', 
      icon: '🔄' 
    },
  ];
  
  const currentMode = modes.find((m) => m.id === mode);
  
  return (
    <div className="min-h-screen ink-bg">
      {/* 页面标题 */}
      <div className="text-center pt-8 pb-4 px-4">
        <h1 className="text-3xl md:text-4xl font-bold text-imperial-gold tracking-wider">
          榫卯节点 · 半刚性阻尼器
        </h1>
        <p className="text-gray-500 text-sm mt-2 tracking-widest">
          古代建筑抗震核心技术 · 力学原理可视化
        </p>
        <div className="chinese-divider max-w-xs mx-auto mt-4" />
      </div>
      
      <div className="max-w-7xl mx-auto px-4 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 3D 视口 */}
          <div className="lg:col-span-2 h-[500px] md:h-[600px] gold-border rounded-lg overflow-hidden bg-imperial-deeper/50">
            <Canvas camera={{ position: [3, 3, 5], fov: 45 }} shadows>
              <Suspense fallback={null}>
                <SunmaoScene mode={mode} />
              </Suspense>
            </Canvas>
          </div>
          
          {/* 右侧控制面板 */}
          <div className="space-y-4">
            {/* 模拟模式选择 */}
            <div className="gold-border rounded-lg p-4 bg-imperial-deeper/50">
              <h3 className="text-imperial-gold text-sm font-bold tracking-wider mb-3">🎮 模拟模式</h3>
              <div className="space-y-2">
                {modes.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMode(m.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded text-xs transition-all text-left ${
                      mode === m.id
                        ? 'bg-imperial-gold/15 text-imperial-gold border border-imperial-gold/30'
                        : 'border border-gray-700 text-gray-400 hover:border-imperial-gold/40 hover:text-imperial-gold'
                    }`}
                  >
                    <span className="text-base">{m.icon}</span>
                    <span className="font-bold">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>
            
            {/* 当前模式说明 */}
            <div className="gold-border rounded-lg p-4 bg-imperial-deeper/50">
              <h3 className="text-imperial-gold text-sm font-bold tracking-wider mb-3">📋 工作原理</h3>
              {currentMode && (
                <div className="animate-fade-in">
                  <p className="text-imperial-gold text-sm font-bold mb-2 flex items-center gap-2">
                    <span className="text-lg">{currentMode.icon}</span>
                    {currentMode.label}
                  </p>
                  <p className="text-gray-400 text-xs leading-relaxed">{currentMode.desc}</p>
                </div>
              )}
            </div>
            
            {/* 榫卯信息 */}
            <div className="gold-border rounded-lg p-4 bg-imperial-deeper/50">
              <h3 className="text-imperial-gold text-sm font-bold tracking-wider mb-3">📖 节点特性</h3>
              <div className="space-y-2 text-xs">
                {Object.entries({
                  '名称': SUNMAO_INFO.name,
                  '类型': SUNMAO_INFO.type,
                  '刚度': SUNMAO_INFO.stiffness,
                  '阻尼': SUNMAO_INFO.damping,
                }).map(([key, val]) => (
                  <div key={key} className="flex">
                    <span className="text-imperial-gold/60 w-12 shrink-0">{key}</span>
                    <span className="text-gray-400">{val}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-imperial-gold/10">
                <p className="text-gray-400 text-xs leading-relaxed">
                  <span className="text-imperial-gold">核心优势：</span>
                  {SUNMAO_INFO.advantage}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* 能量耗散曲线图 */}
        <div className="mt-6 gold-border rounded-lg p-4 bg-imperial-deeper/50">
          <ReactEChartsCore
            echarts={echarts}
            option={getEnergyChartOption(mode)}
            style={{ height: 300 }}
            opts={{ renderer: 'canvas' }}
          />
          <div className="mt-3 text-xs text-gray-500 text-center">
            <p>红色区域：榫卯节点通过木材纤维挤压变形耗散的能量（转化为热能）</p>
            <p className="mt-1">绿色曲线：传递到主体结构的剩余能量（越小越好）</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SunmaoPage;
