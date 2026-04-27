import { useRef, useState, useMemo, Suspense, useCallback, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Html } from '@react-three/drei';
import ReactEChartsCore from 'echarts-for-react';
import * as echarts from 'echarts/core';
import { LineChart, BarChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, TitleComponent, LegendComponent, MarkLineComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import * as THREE from 'three';
import PointCloudBridge from '../components/PointCloudBridge';

echarts.use([LineChart, BarChart, GridComponent, TooltipComponent, TitleComponent, LegendComponent, MarkLineComponent, CanvasRenderer]);

/* ==========================================================================
   赵州桥精确测绘数据（基于现代工程测量）
   ========================================================================== */

const BRIDGE_SPECS = {
  totalLength: 50.82,
  totalWidth: 9.6,
  totalHeight: 8.7,
  mainSpan: 37.02,
  mainRise: 7.23,
  archThickness: 1.03,
  archWidth: 9.0,
  archRadius: 27.7,
  smallArch: [
    { span: 3.8, rise: 1.63, offsetX: -14.5, offsetY: 5.8 },
    { span: 2.85, rise: 1.13, offsetX: -10.2, offsetY: 6.5 },
    { span: 2.85, rise: 1.13, offsetX: 10.2, offsetY: 6.5 },
    { span: 3.8, rise: 1.63, offsetX: 14.5, offsetY: 5.8 },
  ],
  deckHeight: 8.7,
  railingHeight: 0.8,
  abutmentLength: 5.0,
  abutmentWidth: 10.0,
  abutmentDepth: 1.8,
  vaultCount: 28,
};

const BRIDGE_INFO = {
  name: '赵州桥（安济桥）',
  builder: '传统上归于隋代工匠李春',
  dynasty: '隋代，约 605-616 年',
  span: '37.02 m',
  rise: '7.23 m',
  ratio: '约 1:5.12（矢跨比约 0.195）',
  feature: '主拱为低矢跨比圆弧石拱，两侧设 4 个敞肩小拱，用于减重、泄洪并让恒载压力线更贴近拱轴。',
};

const PAPER_BASED_HIGHLIGHTS = [
  {
    title: '低矢跨比圆弧主拱',
    body: '主拱不是高耸的半圆拱，而是较扁的圆弧拱。论文认为，这种几何形式提升跨越能力，但也使桥台必须可靠承受较大的水平推力，因此拱轴与压力线的贴合尤为关键。',
    tone: 'green',
  },
  {
    title: '敞肩小拱是受力优化构件',
    body: '两侧四个敞肩小拱并非装饰孔洞。论文给出它们可减轻约 700 t 自重、增加约 16.5% 过水面积，并显著改善主拱恒载压力线，使主拱更接近纯受压工作。',
    tone: 'blue',
  },
  {
    title: '28 道并列薄拱券',
    body: '赵州桥沿桥宽方向由 28 道并列薄拱券组成，每道约 0.34 m。它们共同承担荷载，也允许局部差异变形，提高结构适应性与维修便利性，但不应被表述为现代意义上的隔震层。',
    tone: 'yellow',
  },
  {
    title: '横向联系与浅基础共同工作',
    body: '桥身通过横向铁拉杆、铁件连接与较宽拱脚增强整体性；桥台和浅基础共同承受拱推力。论文记录其长期沉降较小，说明上部受力组织对基础工作状态非常重要。',
    tone: 'red',
  },
];

const PAPER_METRICS = [
  { label: '减重效果', value: '约 700 t', detail: '敞肩小拱降低恒载与地震惯性力' },
  { label: '过水面积增幅', value: '约 16.5%', detail: '洪水期减小壅水与附加水压力' },
  { label: '并列拱券', value: '28 道', detail: '沿桥宽并列布置，单道宽约 0.34 m' },
  { label: '压力线偏差', value: '< 5%', detail: '有肩拱时压力线与拱轴更贴合' },
];

const STRUCTURE_REFERENCES = [
  'Zhou, M. et al. Spanning over 1400 years: China’s remarkable Zhaozhou Bridge, 2017.',
  '刘云、王大钧：《伏拱对赵州桥力学行为的影响》，《力学与实践》, 2001。',
];

type ViewMode = 'solid' | 'pointcloud' | 'wireframe';

/* ========== 地震参数预设 ========== */
const EARTHQUAKE_PRESETS = [
  { id: 'mild', label: '5级（弱震）', magnitude: 5, intensity: 0.3, freq: 2.5, desc: '轻度地震输入，观察主拱与桥台的基本动力响应。' },
  { id: 'moderate', label: '6级（中震）', magnitude: 6, intensity: 0.6, freq: 3.5, desc: '中等地震输入，拱脚与 1/4 跨的水平推力效应更明显。' },
  { id: 'strong', label: '7级（强震）', magnitude: 7, intensity: 1.0, freq: 5.0, desc: '强震工况下仍以压应力主导，重点观察拱脚与桥台受力。' },
  { id: 'extreme', label: '8级（烈震）', magnitude: 8, intensity: 1.5, freq: 6.0, desc: '超常输入用于教学演示，不等同于实桥实测极限状态。' },
];

/* ========== 应力热力图颜色插值 ========== */
function stressToColor(stress: number, maxStress: number): THREE.Color {
  const t = Math.min(1, Math.max(0, stress / maxStress));
  if (t < 0.25) {
    return new THREE.Color().lerpColors(new THREE.Color('#1a9850'), new THREE.Color('#91cf60'), t * 4);
  } else if (t < 0.5) {
    return new THREE.Color().lerpColors(new THREE.Color('#91cf60'), new THREE.Color('#fee08b'), (t - 0.25) * 4);
  } else if (t < 0.75) {
    return new THREE.Color().lerpColors(new THREE.Color('#fee08b'), new THREE.Color('#fc8d59'), (t - 0.5) * 4);
  } else {
    return new THREE.Color().lerpColors(new THREE.Color('#fc8d59'), new THREE.Color('#d73027'), (t - 0.75) * 4);
  }
}

function stressToHex(stress: number, maxStress: number): string {
  return '#' + stressToColor(stress, maxStress).getHexString();
}

/* ========== 伪随机石材色差生成器 ========== */
function stoneColor(seed: number): string {
  const h = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  const variation = (h - Math.floor(h)) * 0.12 - 0.06;
  const base = 0.72 + variation;
  const r = Math.round(Math.min(255, Math.max(0, base * 255 * 1.02)));
  const g = Math.round(Math.min(255, Math.max(0, base * 255 * 1.00)));
  const b = Math.round(Math.min(255, Math.max(0, base * 255 * 0.94)));
  return `rgb(${r},${g},${b})`;
}

/* ========== 几何工具函数 ========== */

function createCircularArchCurve(span: number, rise: number, radius: number, segments: number): THREE.Vector3[] {
  const pts: THREE.Vector3[] = [];
  const centerY = radius - rise;
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const x = (t - 0.5) * span;
    const distFromCenter = Math.sqrt(radius * radius - x * x);
    const y = distFromCenter - centerY;
    pts.push(new THREE.Vector3(x, y, 0));
  }
  return pts;
}

function createSmallArchCurve(span: number, rise: number, segments: number): THREE.Vector3[] {
  const pts: THREE.Vector3[] = [];
  const halfSpan = span / 2;
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

function createArchShape(
  span: number, rise: number, thickness: number,
  radius: number | null, segments: number, deformation: number
): THREE.Shape {
  const shape = new THREE.Shape();
  const outerCurve = radius
    ? createCircularArchCurve(span, rise - deformation, radius, segments)
    : createSmallArchCurve(span, rise - deformation, segments);
  const innerCurve = radius
    ? createCircularArchCurve(span, rise - thickness - deformation, radius, segments)
    : createSmallArchCurve(span, rise - thickness - deformation, segments);
  outerCurve.forEach((p, i) => (i === 0 ? shape.moveTo(p.x, p.y) : shape.lineTo(p.x, p.y)));
  for (let i = innerCurve.length - 1; i >= 0; i--) shape.lineTo(innerCurve[i].x, innerCurve[i].y);
  shape.closePath();
  return shape;
}

/* ========== 计算各部位应力值 ========== */
function computeStressField(
  load: number, forcePosition: number,
  earthquakeIntensity: number, earthquakeTime: number, isQuaking: boolean
): { positions: string[]; values: number[]; maxStress: number } {
  const positions = ['左拱脚', '左 1/4 跨', '拱顶', '右 1/4 跨', '右拱脚'];
  const posCoords = [-1, -0.5, 0, 0.5, 1];
  const baseStress = [88, 62, 38, 62, 88];

  const values = baseStress.map((base, i) => {
    const posCoord = posCoords[i];
    const distance = Math.abs(posCoord - forcePosition);
    const influenceFactor = Math.max(0.2, 1 - distance * 0.55);
    const loadIncrease = load * influenceFactor * (Math.abs(posCoord) > 0.8 ? 0.18 : 0.24);
    const thrustBoost = load * (Math.abs(posCoord) > 0.8 ? 0.12 : Math.abs(posCoord) > 0.3 ? 0.05 : 0.02);
    const openSpandrelRelief = Math.abs(posCoord) < 0.65 ? -6 : 0;

    let seismicStress = 0;
    if (isQuaking && earthquakeIntensity > 0) {
      const wavePhase = earthquakeTime * 5.0 + posCoord * 2.0;
      const primaryWave = Math.sin(wavePhase) * earthquakeIntensity * 11;
      const secondaryWave = Math.sin(wavePhase * 2.3 + 1.2) * earthquakeIntensity * 5;
      const highFreq = Math.sin(wavePhase * 7.1) * earthquakeIntensity * 2.5;
      seismicStress = Math.abs(primaryWave + secondaryWave + highFreq);

      if (Math.abs(posCoord) > 0.8) seismicStress *= 1.45;
      else if (Math.abs(posCoord) > 0.3) seismicStress *= 1.1;
      else seismicStress *= 0.72;
    }

    return Math.min(120, Math.max(18, base + loadIncrease + thrustBoost + openSpandrelRelief + seismicStress));
  });

  return { positions, values, maxStress: 120 };
}

/* ========== 地震波纹视觉效果 ========== */
function SeismicWaves({ intensity, time }: { intensity: number; time: number }) {
  const wavesRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (wavesRef.current) {
      wavesRef.current.children.forEach((child, i) => {
        const mesh = child as THREE.Mesh;
        const phase = (time * 2 + i * 0.8) % 4;
        const scale = 1 + phase * 8;
        const opacity = Math.max(0, 1 - phase / 4) * intensity * 0.35;
        mesh.scale.set(scale, 1, scale);
        (mesh.material as THREE.MeshBasicMaterial).opacity = opacity;
      });
    }
  });

  return (
    <group ref={wavesRef} position={[0, -0.19, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={`wave-${i}`}>
          <ringGeometry args={[0.8, 1.0, 32]} />
          <meshBasicMaterial color="#DC143C" transparent opacity={0} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

/* ========== 地面裂缝效果 ========== */
function GroundCracks({ intensity, time }: { intensity: number; time: number }) {
  if (intensity < 0.5) return null;
  const crackCount = Math.floor(intensity * 6);

  return (
    <group position={[0, -0.17, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      {Array.from({ length: crackCount }).map((_, i) => {
        const angle = (i / crackCount) * Math.PI * 2 + time * 0.1;
        const len = 2 + intensity * 3 + Math.sin(time + i) * 0.5;
        const x = Math.cos(angle) * 2;
        const z = Math.sin(angle) * 2;
        return (
          <mesh key={`crack-${i}`} position={[x, z, 0]} rotation={[0, 0, angle]}>
            <planeGeometry args={[len, 0.03 * intensity]} />
            <meshBasicMaterial color="#1A0A00" transparent opacity={0.7 * intensity} />
          </mesh>
        );
      })}
    </group>
  );
}

/* ========== 落石粒子效果 ========== */
function FallingDebris({ intensity, time, isQuaking }: { intensity: number; time: number; isQuaking: boolean }) {
  const particles = useMemo(() => {
    if (!isQuaking || intensity < 0.6) return [];
    const count = Math.floor(intensity * 8);
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * 3.5,
      z: (Math.random() - 0.5) * 1.0,
      startY: 0.87 + Math.random() * 0.15,
      speed: 0.3 + Math.random() * 0.5,
      size: 0.01 + Math.random() * 0.02,
      phase: Math.random() * Math.PI * 2,
    }));
  }, [isQuaking, intensity > 0.6 ? Math.floor(intensity * 4) : 0]);

  return (
    <group scale={0.1}>
      {particles.map((p) => {
        const fallProgress = ((time * p.speed + p.phase) % 2) / 2;
        const y = p.startY - fallProgress * 1.0;
        if (y < -0.2) return null;
        return (
          <mesh key={`debris-${p.id}`} position={[p.x, y, p.z]}>
            <boxGeometry args={[p.size, p.size, p.size]} />
            <meshStandardMaterial color="#8A8A78" roughness={1} />
          </mesh>
        );
      })}
    </group>
  );
}

/* ========== 赵州桥 3D 模型组件 ========== */
function BridgeModel({
  load,
  forcePosition,
  onPositionClick,
  wireframe,
  earthquakeIntensity,
  earthquakeTime,
  isQuaking,
  showStressHeatmap,
}: {
  load: number;
  forcePosition: number;
  onPositionClick: (pos: number) => void;
  wireframe: boolean;
  earthquakeIntensity: number;
  earthquakeTime: number;
  isQuaking: boolean;
  showStressHeatmap: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);

  const scale = 0.1;
  const S = BRIDGE_SPECS;

  const deformation = useMemo(() => load * 0.0015, [load]);

  const forcePoints = useMemo(() =>
    Array.from({ length: 11 }, (_, i) => (i / 10) * 2 - 1),
  []);

  const seismicOffset = useMemo(() => {
    if (!isQuaking || earthquakeIntensity <= 0) return { x: 0, y: 0, rz: 0 };
    const amp = earthquakeIntensity * 0.25;
    const x = Math.sin(earthquakeTime * 8.5) * amp
            + Math.sin(earthquakeTime * 13.2 + 0.7) * amp * 0.4
            + Math.sin(earthquakeTime * 21.0 + 2.1) * amp * 0.15;
    const y = Math.sin(earthquakeTime * 12.3 + 1.5) * amp * 0.3
            + Math.sin(earthquakeTime * 18.7) * amp * 0.1;
    const rz = Math.sin(earthquakeTime * 6.0 + 0.8) * amp * 0.008;
    return { x, y, rz };
  }, [isQuaking, earthquakeIntensity, earthquakeTime]);

  const stressField = useMemo(() => {
    return computeStressField(load, forcePosition, earthquakeIntensity, earthquakeTime, isQuaking);
  }, [load, forcePosition, earthquakeIntensity, earthquakeTime, isQuaking]);

  const getArchStressColor = useCallback((normalizedX: number) => {
    if (!showStressHeatmap) return null;
    const absX = normalizedX / (S.mainSpan / 2);
    const t = (absX + 1) / 2;
    const idx = t * (stressField.values.length - 1);
    const lo = Math.floor(idx);
    const hi = Math.min(lo + 1, stressField.values.length - 1);
    const frac = idx - lo;
    const stress = stressField.values[lo] * (1 - frac) + stressField.values[hi] * frac;
    return stressToHex(stress, stressField.maxStress);
  }, [showStressHeatmap, stressField]);

  const mainArchCurve = useMemo(() => {
    return createCircularArchCurve(S.mainSpan, S.mainRise - deformation, S.archRadius, 120);
  }, [deformation]);

  const mainArchShape = useMemo(() => {
    return createArchShape(S.mainSpan, S.mainRise, S.archThickness, S.archRadius, 120, deformation);
  }, [deformation]);

  const voussoirBlocks = useMemo(() => {
    const blocks: Array<{ position: [number, number, number]; rotation: number; width: number; height: number; depth: number; color: string }> = [];
    const vaultWidth = S.archWidth / S.vaultCount;
    const stoneCountPerVault = 18;
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
          width: blockLen * 0.96,
          height: S.archThickness * 0.98,
          depth: vaultWidth * 0.94,
          color: stoneColor(v * stoneCountPerVault + s),
        });
      }
    }
    return blocks;
  }, [mainArchCurve]);

  const spandrelWalls = useMemo(() => {
    const walls: Array<{ shape: THREE.Shape; zPos: number }> = [];
    const wallThickness = 0.3;
    const facePositions = [-S.archWidth / 2 + wallThickness / 2, S.archWidth / 2 - wallThickness / 2];
    for (const zPos of facePositions) {
      const shape = new THREE.Shape();
      const deckBottom = S.deckHeight - 0.6 - deformation;
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
      shape.moveTo(archPts[0].x, archPts[0].y);
      for (let i = 1; i < archPts.length; i++) shape.lineTo(archPts[i].x, archPts[i].y);
      shape.lineTo(archPts[archPts.length - 1].x, deckBottom);
      shape.lineTo(archPts[0].x, deckBottom);
      shape.closePath();
      for (const arch of S.smallArch) {
        const holeCurve = createSmallArchCurve(arch.span, arch.rise, 24);
        const hole = new THREE.Path();
        holeCurve.forEach((p, i) => {
          const px = p.x + arch.offsetX;
          const py = p.y + arch.offsetY;
          if (i === 0) hole.moveTo(px, py);
          else hole.lineTo(px, py);
        });
        hole.lineTo(arch.offsetX + arch.span / 2, arch.offsetY);
        hole.lineTo(arch.offsetX - arch.span / 2, arch.offsetY);
        hole.closePath();
        shape.holes.push(hole);
      }
      walls.push({ shape, zPos });
    }
    return walls;
  }, [deformation]);

  /* 应力热力图拱段：沿拱轴线分段着色 */
  const stressSegments = useMemo(() => {
    if (!showStressHeatmap) return [];
    const segCount = 20;
    const segs: Array<{ x: number; y: number; w: number; h: number; color: string }> = [];
    for (let i = 0; i < segCount; i++) {
      const t = i / segCount;
      const x = (t + 0.5 / segCount - 0.5) * S.mainSpan;
      const centerY = S.archRadius - (S.mainRise - deformation);
      const dist = Math.sqrt(Math.max(0, S.archRadius * S.archRadius - x * x));
      const y = dist - centerY;
      const color = getArchStressColor(x) || '#888';
      segs.push({
        x, y: y + S.archThickness / 2,
        w: S.mainSpan / segCount * 0.95,
        h: S.archThickness * 1.5,
        color,
      });
    }
    return segs;
  }, [showStressHeatmap, deformation, getArchStressColor]);

  return (
    <group
      ref={groupRef}
      scale={scale}
      position={[seismicOffset.x, seismicOffset.y, 0]}
      rotation={[0, 0, seismicOffset.rz]}
    >
      {/* 主拱圈 */}
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
        <extrudeGeometry args={[mainArchShape, { depth: S.archWidth, bevelEnabled: false }]} />
        <meshStandardMaterial
          color={showStressHeatmap ? '#888880' : '#B0B0A2'}
          roughness={0.88}
          metalness={0.02}
          wireframe={wireframe}
          transparent={showStressHeatmap}
          opacity={showStressHeatmap ? 0.5 : 1}
        />
      </mesh>

      {/* 应力热力图覆盖层 */}
      {showStressHeatmap && stressSegments.map((seg, i) => (
        <mesh
          key={`stress-seg-${i}`}
          position={[seg.x, seg.y, 0]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <boxGeometry args={[seg.w, S.archWidth * 0.98, seg.h]} />
          <meshStandardMaterial
            color={seg.color}
            transparent
            opacity={0.75}
            emissive={seg.color}
            emissiveIntensity={0.2}
          />
        </mesh>
      ))}

      {/* 拱石纹理层 */}
      {!wireframe && !showStressHeatmap && voussoirBlocks.filter((_, i) => i % 3 === 0).map((block, i) => (
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

      {/* 腹墙 */}
      {spandrelWalls.map((wall, i) => (
        <mesh key={`spandrel-${i}`} position={[0, 0, wall.zPos]} castShadow>
          <shapeGeometry args={[wall.shape]} />
          <meshStandardMaterial
            color={showStressHeatmap ? '#777770' : '#A8A898'}
            roughness={0.9}
            metalness={0.02}
            side={THREE.DoubleSide}
            wireframe={wireframe}
            transparent={showStressHeatmap}
            opacity={showStressHeatmap ? 0.4 : 1}
          />
        </mesh>
      ))}

      {/* 4个敞肩小拱 */}
      {S.smallArch.map((arch, idx) => {
        const smallShape = createArchShape(arch.span, arch.rise, 0.35, null, 24, 0);
        const smallArchColor = showStressHeatmap
          ? stressToHex(stressField.values[idx < 2 ? 1 : 3] * 0.7, stressField.maxStress)
          : '#C0C0B0';
        return (
          <mesh
            key={`small-${idx}`}
            position={[arch.offsetX, arch.offsetY, 0]}
            rotation={[Math.PI / 2, 0, 0]}
            castShadow
          >
            <extrudeGeometry args={[smallShape, { depth: S.archWidth * 0.92, bevelEnabled: false }]} />
            <meshStandardMaterial
              color={smallArchColor}
              roughness={0.82}
              metalness={0.03}
              wireframe={wireframe}
              emissive={showStressHeatmap ? smallArchColor : undefined}
              emissiveIntensity={showStressHeatmap ? 0.15 : 0}
            />
          </mesh>
        );
      })}

      {/* 小拱拱石纹理 */}
      {!wireframe && !showStressHeatmap && S.smallArch.map((arch, idx) => {
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

      {/* 桥面填充层 */}
      <mesh position={[0, S.deckHeight - 0.3 - deformation, 0]} receiveShadow>
        <boxGeometry args={[S.mainSpan + 2, 0.6, S.archWidth]} />
        <meshStandardMaterial color={showStressHeatmap ? '#777770' : '#A8A898'} roughness={0.9} wireframe={wireframe} />
      </mesh>

      {/* 桥面铺装 */}
      <mesh position={[0, S.deckHeight - deformation, 0]} receiveShadow>
        <boxGeometry args={[S.mainSpan + 1, 0.12, S.totalWidth]} />
        <meshStandardMaterial color={showStressHeatmap ? '#666660' : '#9A9A88'} roughness={0.95} wireframe={wireframe} />
      </mesh>

      {/* 桥面石板纹理 */}
      {!wireframe && !showStressHeatmap && Array.from({ length: 24 }).map((_, i) => {
        const x = (i / 23 - 0.5) * S.mainSpan * 0.95;
        return (
          <mesh key={`deck-joint-${i}`} position={[x, S.deckHeight + 0.065 - deformation, 0]} receiveShadow>
            <boxGeometry args={[0.04, 0.01, S.totalWidth * 0.98]} />
            <meshStandardMaterial color="#7A7A6A" roughness={1} />
          </mesh>
        );
      })}

      {/* 桥面着力点 */}
      {!isQuaking && forcePoints.map((pos, i) => {
        const xPos = pos * (S.mainSpan / 2) * 0.9;
        const isSelected = Math.abs(forcePosition - pos) < 0.01;
        return (
          <mesh
            key={`force-point-${i}`}
            position={[xPos, S.deckHeight + 0.08 - deformation, 0]}
            onClick={(e) => { e.stopPropagation(); onPositionClick(pos); }}
            onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
            onPointerOut={() => { document.body.style.cursor = 'default'; }}
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

      {/* 栏杆系统 */}
      {[-1, 1].map((side) => {
        const zBase = side * S.totalWidth / 2;
        const postCount = 22;
        return (
          <group key={`railing-${side}`}>
            <mesh position={[0, S.deckHeight + 0.05 - deformation, zBase]}>
              <boxGeometry args={[S.mainSpan * 0.97, 0.1, 0.2]} />
              <meshStandardMaterial color="#A0A090" roughness={0.9} wireframe={wireframe} />
            </mesh>
            {Array.from({ length: postCount }).map((_, i) => {
              const x = (i / (postCount - 1) - 0.5) * S.mainSpan * 0.95;
              return (
                <group key={`post-${side}-${i}`} position={[x, S.deckHeight - deformation, zBase]}>
                  <mesh position={[0, S.railingHeight / 2 + 0.1, 0]}>
                    <boxGeometry args={[0.14, S.railingHeight, 0.14]} />
                    <meshStandardMaterial color={stoneColor(i * side + 500)} roughness={0.82} wireframe={wireframe} />
                  </mesh>
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
            {Array.from({ length: postCount - 1 }).map((_, i) => {
              const x1 = (i / (postCount - 1) - 0.5) * S.mainSpan * 0.95;
              const x2 = ((i + 1) / (postCount - 1) - 0.5) * S.mainSpan * 0.95;
              const mx = (x1 + x2) / 2;
              const panelWidth = x2 - x1 - 0.16;
              return (
                <group key={`panel-${side}-${i}`}>
                  <mesh position={[mx, S.deckHeight + S.railingHeight / 2 + 0.1 - deformation, zBase]}>
                    <boxGeometry args={[panelWidth, S.railingHeight * 0.75, 0.07]} />
                    <meshStandardMaterial color={stoneColor(i * side + 800)} roughness={0.78} wireframe={wireframe} />
                  </mesh>
                  {!wireframe && (
                    <mesh position={[mx, S.deckHeight + S.railingHeight / 2 + 0.1 - deformation, zBase + side * 0.04]}>
                      <boxGeometry args={[panelWidth * 0.8, S.railingHeight * 0.35, 0.015]} />
                      <meshStandardMaterial color="#C5C5B5" roughness={0.7} />
                    </mesh>
                  )}
                </group>
              );
            })}
            <mesh position={[0, S.deckHeight + S.railingHeight + 0.12 - deformation, zBase]}>
              <boxGeometry args={[S.mainSpan * 0.97, 0.06, 0.16]} />
              <meshStandardMaterial color="#BFBFAF" roughness={0.8} wireframe={wireframe} />
            </mesh>
          </group>
        );
      })}

      {/* 桥台 */}
      {[-1, 1].map((side) => {
        const xBase = side * (S.mainSpan / 2 + S.abutmentLength / 2);
        const abutColor = showStressHeatmap
          ? stressToHex(stressField.values[side < 0 ? 0 : 4], stressField.maxStress)
          : '#8A8A78';
        return (
          <group key={`abutment-${side}`}>
            <mesh position={[xBase, -S.abutmentDepth / 2, 0]} receiveShadow>
              <boxGeometry args={[S.abutmentLength, S.abutmentDepth, S.abutmentWidth]} />
              <meshStandardMaterial
                color={abutColor}
                roughness={0.95}
                wireframe={wireframe}
                emissive={showStressHeatmap ? abutColor : undefined}
                emissiveIntensity={showStressHeatmap ? 0.15 : 0}
              />
            </mesh>
            <mesh position={[xBase, S.abutmentDepth * 0.3, 0]} receiveShadow>
              <boxGeometry args={[S.abutmentLength * 0.8, S.abutmentDepth * 0.6, S.abutmentWidth * 0.95]} />
              <meshStandardMaterial color={showStressHeatmap ? abutColor : '#929280'} roughness={0.93} wireframe={wireframe} />
            </mesh>
            {!wireframe && !showStressHeatmap && Array.from({ length: 5 }).map((_, li) => (
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

      {/* 荷载箭头 */}
      {load > 0 && !isQuaking && (
        <group position={[forcePosition * (S.mainSpan / 2) * 0.9, S.deckHeight + 1.5 - deformation, 0]}>
          <mesh>
            <coneGeometry args={[0.3, 1.0, 8]} />
            <meshStandardMaterial color="#DC143C" emissive="#DC143C" emissiveIntensity={0.5} />
          </mesh>
          <mesh position={[0, 0.8, 0]}>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshStandardMaterial color="#DC143C" emissive="#DC143C" emissiveIntensity={0.3} />
          </mesh>
        </group>
      )}

      {/* 地震方向指示箭头 */}
      {isQuaking && (
        <group position={[0, S.deckHeight + 2.0, 0]}>
          <mesh position={[-1.5, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <coneGeometry args={[0.2, 0.6, 6]} />
            <meshStandardMaterial color="#FF4444" emissive="#FF4444" emissiveIntensity={0.6} transparent opacity={0.8} />
          </mesh>
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[2.5, 0.08, 0.08]} />
            <meshStandardMaterial color="#FF4444" emissive="#FF4444" emissiveIntensity={0.4} transparent opacity={0.7} />
          </mesh>
          <mesh position={[1.5, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
            <coneGeometry args={[0.2, 0.6, 6]} />
            <meshStandardMaterial color="#FF4444" emissive="#FF4444" emissiveIntensity={0.6} transparent opacity={0.8} />
          </mesh>
          <Html position={[0, 0.6, 0]} center>
            <div className="bg-red-900/80 text-red-300 px-2 py-0.5 rounded text-[10px] border border-red-500/40 whitespace-nowrap">
              {`${EARTHQUAKE_PRESETS.find(p => Math.abs(p.intensity - earthquakeIntensity) < 0.01)?.label || '地震力'}`}
            </div>
          </Html>
        </group>
      )}

      {/* 地面 */}
      <mesh position={[0, -S.abutmentDepth - 0.2, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[80, 30]} />
        <meshStandardMaterial color="#3A3A30" roughness={1} />
      </mesh>

      {/* 水面 */}
      <mesh position={[0, -S.abutmentDepth + 0.3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[60, 20]} />
        <meshStandardMaterial
          color={isQuaking ? '#3A5A6A' : '#2A4A5A'}
          roughness={0.2}
          metalness={0.6}
          transparent
          opacity={0.7}
        />
      </mesh>

      {/* 河岸护坡 */}
      {[-1, 1].map((side) => (
        <mesh key={`bank-${side}`} position={[side * 32, -S.abutmentDepth - 0.5, 0]} receiveShadow>
          <boxGeometry args={[18, 0.8, 22]} />
          <meshStandardMaterial color="#4A4A3A" roughness={1} wireframe={wireframe} />
        </mesh>
      ))}

      {/* 地震波纹 */}
      {isQuaking && <SeismicWaves intensity={earthquakeIntensity} time={earthquakeTime} />}

      {/* 地面裂缝 */}
      {isQuaking && <GroundCracks intensity={earthquakeIntensity} time={earthquakeTime} />}

      {/* 应力色标图例 */}
      {showStressHeatmap && (
        <Html position={[S.mainSpan / 2 + 4, S.deckHeight / 2, 0]} center>
          <div className="bg-black/80 backdrop-blur-sm rounded px-2 py-1.5 border border-imperial-gold/20">
            <div className="text-[9px] text-imperial-gold mb-1 text-center font-bold">相对压应力指标</div>
            <div className="w-4 h-24 rounded-sm overflow-hidden" style={{
              background: 'linear-gradient(to top, #1a9850, #91cf60, #fee08b, #fc8d59, #d73027)'
            }} />
            <div className="flex flex-col justify-between h-24 absolute right-[-18px] top-[18px]">
              <span className="text-[8px] text-red-400">120</span>
              <span className="text-[8px] text-yellow-400">60</span>
              <span className="text-[8px] text-green-400">0</span>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

/* ========== 地震动画场景 ========== */
function EarthquakeAnimatedScene({
  load, forcePosition, onPositionClick, wireframe,
  earthquakeIntensity, isQuaking, showStressHeatmap,
  onTimeUpdate,
}: {
  load: number; forcePosition: number;
  onPositionClick: (pos: number) => void;
  wireframe: boolean;
  earthquakeIntensity: number;
  isQuaking: boolean;
  showStressHeatmap: boolean;
  onTimeUpdate: (time: number) => void;
}) {
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    if (isQuaking) {
      timeRef.current += delta;
      onTimeUpdate(timeRef.current);
    }
  });

  return (
    <BridgeModel
      load={load}
      forcePosition={forcePosition}
      onPositionClick={onPositionClick}
      wireframe={wireframe}
      earthquakeIntensity={earthquakeIntensity}
      earthquakeTime={timeRef.current}
      isQuaking={isQuaking}
      showStressHeatmap={showStressHeatmap}
    />
  );
}

/* ========== 动态应力分布图 ========== */
function getDynamicStressChartOption(
  load: number, forcePosition: number,
  earthquakeIntensity: number, earthquakeTime: number, isQuaking: boolean
) {
  const field = computeStressField(load, forcePosition, earthquakeIntensity, earthquakeTime, isQuaking);

  const barColors = field.values.map((v) => stressToHex(v, field.maxStress));

  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis' as const,
      backgroundColor: 'rgba(10,10,15,0.95)',
      borderColor: '#FFD700',
      textStyle: { color: '#E8E8E8', fontSize: 11 },
    },
    xAxis: {
      type: 'category' as const,
      data: field.positions,
      axisLine: { lineStyle: { color: '#C5A55A40' } },
      axisLabel: { color: '#999', fontSize: 10 },
    },
    yAxis: {
      type: 'value' as const,
      name: '相对压应力',
      nameTextStyle: { color: '#999', fontSize: 10 },
      max: 130,
      axisLine: { lineStyle: { color: '#C5A55A40' } },
      axisLabel: { color: '#999', fontSize: 10 },
      splitLine: { lineStyle: { color: '#ffffff08' } },
    },
    series: [
      {
        type: 'bar',
        data: field.values.map((v, i) => ({
          value: Math.round(v * 10) / 10,
          itemStyle: { color: barColors[i], borderRadius: [4, 4, 0, 0] },
        })),
        barWidth: '40%',
        animationDuration: 200,
        animationEasing: 'linear',
      },
    ],
    grid: { top: 30, bottom: 30, left: 50, right: 20 },
  };
}

/* ========== 地震波加速度时程图 ========== */
function getSeismicWaveChartOption(intensity: number, currentTime: number, isQuaking: boolean) {
  const totalDuration = 20;
  const dt = 0.05;
  const steps = Math.floor(totalDuration / dt);

  const timeData: number[] = [];
  const accData: number[] = [];
  const currentIdx = Math.floor(currentTime / dt);

  for (let i = 0; i <= steps; i++) {
    const t = i * dt;
    timeData.push(Math.round(t * 100) / 100);

    const envelope = Math.exp(-0.05 * Math.abs(t - 5)) * (t < 1 ? t : 1);
    const acc = intensity * envelope * (
      Math.sin(t * 8.5) * 0.6 +
      Math.sin(t * 13.2 + 0.7) * 0.25 +
      Math.sin(t * 21.0 + 2.1) * 0.1 +
      Math.sin(t * 3.0) * 0.05
    ) * 9.8;

    accData.push(Math.round(acc * 100) / 100);
  }

  return {
    backgroundColor: 'transparent',
    title: {
      text: '地震波加速度时程',
      left: 'center',
      textStyle: { color: '#FFD700', fontSize: 13 },
    },
    tooltip: {
      trigger: 'axis' as const,
      backgroundColor: 'rgba(10,10,15,0.95)',
      borderColor: '#DC143C',
      textStyle: { color: '#E8E8E8', fontSize: 11 },
      formatter: (params: any) => {
        const p = params[0];
        return `时间: ${p.name}s<br/>加速度: ${p.value} m/s²`;
      },
    },
    xAxis: {
      type: 'category' as const,
      data: timeData.map(String),
      name: '时间 (s)',
      nameTextStyle: { color: '#999', fontSize: 10 },
      axisLine: { lineStyle: { color: '#C5A55A40' } },
      axisLabel: { color: '#999', fontSize: 9, interval: Math.floor(steps / 8) },
    },
    yAxis: {
      type: 'value' as const,
      name: '加速度 (m/s²)',
      nameTextStyle: { color: '#999', fontSize: 10 },
      axisLine: { lineStyle: { color: '#C5A55A40' } },
      axisLabel: { color: '#999', fontSize: 9 },
      splitLine: { lineStyle: { color: '#ffffff08' } },
    },
    series: [
      {
        type: 'line',
        data: accData,
        lineStyle: { color: '#DC143C', width: 1.5 },
        itemStyle: { color: '#DC143C' },
        smooth: false,
        showSymbol: false,
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(220,20,60,0.25)' },
              { offset: 1, color: 'rgba(220,20,60,0.02)' },
            ],
          },
        },
        markLine: isQuaking ? {
          silent: true,
          data: [{ xAxis: Math.min(currentIdx, steps) }],
          lineStyle: { color: '#FFD700', width: 2, type: 'solid' },
          label: { show: true, formatter: '当前', color: '#FFD700', fontSize: 10 },
          symbol: ['none', 'arrow'],
        } : undefined,
      },
    ],
    grid: { top: 45, bottom: 35, left: 55, right: 20 },
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

  const [isQuaking, setIsQuaking] = useState(false);
  const [earthquakePreset, setEarthquakePreset] = useState(EARTHQUAKE_PRESETS[2]);
  const [earthquakeTime, setEarthquakeTime] = useState(0);
  const [showStressHeatmap, setShowStressHeatmap] = useState(false);
  const [elapsedDisplay, setElapsedDisplay] = useState(0);

  const chartTimerRef = useRef<ReturnType<typeof setInterval>>();

  const handleTimeUpdate = useCallback((t: number) => {
    setEarthquakeTime(t);
  }, []);

  useEffect(() => {
    if (isQuaking) {
      chartTimerRef.current = setInterval(() => {
        setElapsedDisplay((prev) => prev + 0.1);
      }, 100);
    } else {
      if (chartTimerRef.current) clearInterval(chartTimerRef.current);
    }
    return () => { if (chartTimerRef.current) clearInterval(chartTimerRef.current); };
  }, [isQuaking]);

  const startEarthquake = useCallback(() => {
    setEarthquakeTime(0);
    setElapsedDisplay(0);
    setIsQuaking(true);
    setShowStressHeatmap(true);
  }, []);

  const stopEarthquake = useCallback(() => {
    setIsQuaking(false);
  }, []);

  const stressField = computeStressField(load, forcePosition, earthquakePreset.intensity, earthquakeTime, isQuaking);

  const peakStress = Math.max(...stressField.values);
  const thrustLineFit = Math.max(
    72,
    97 - load * 0.08 - Math.abs(forcePosition) * 4 - (isQuaking ? earthquakePreset.intensity * 12 : earthquakePreset.intensity * 4),
  );

  return (
    <div className="min-h-screen ink-bg">
      {/* 页面标题 */}
      <div className="text-center pt-6 pb-3 px-4">
        <h1 className="text-3xl md:text-4xl font-bold text-imperial-gold tracking-wider">
          赵州桥 · 千年抗震奥秘
        </h1>
        <p className="text-gray-500 text-sm mt-2 tracking-widest">
          基于论文结论的敞肩石拱力学可视化 · 地震响应演示 · 结构知识展示
        </p>
        <div className="chinese-divider max-w-xs mx-auto mt-3" />
      </div>

      <div className="max-w-[1500px] mx-auto px-4 pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* 3D 视口 */}
          <div className="lg:col-span-8 h-[460px] md:h-[560px] lg:h-[620px] gold-border rounded-lg overflow-hidden bg-imperial-deeper/50 relative">
            {isQuaking && (
              <div className="absolute inset-0 pointer-events-none z-10 border-2 border-red-500/30 rounded-lg animate-pulse" />
            )}
            <Canvas camera={{ position: [0, 3, 8], fov: 45 }} shadows>
              <Suspense fallback={null}>
                <ambientLight intensity={isQuaking ? 0.3 : 0.4} />
                <directionalLight
                  position={[5, 8, 5]}
                  intensity={isQuaking ? 0.8 : 1}
                  castShadow
                  color={isQuaking ? '#FFE0D0' : '#FFFFFF'}
                />

                {viewMode === 'pointcloud' ? (
                  <PointCloudBridge showCameras />
                ) : (
                  <EarthquakeAnimatedScene
                    load={load}
                    forcePosition={forcePosition}
                    onPositionClick={setForcePosition}
                    wireframe={viewMode === 'wireframe'}
                    earthquakeIntensity={earthquakePreset.intensity}
                    isQuaking={isQuaking}
                    showStressHeatmap={showStressHeatmap}
                    onTimeUpdate={handleTimeUpdate}
                  />
                )}

                <ContactShadows position={[0, -0.51, 0]} opacity={0.3} scale={15} blur={2} />
                <OrbitControls enablePan enableZoom minDistance={4} maxDistance={20} />
                <hemisphereLight args={[isQuaking ? '#FF8040' : '#FFA040', '#2A3A4A', 0.4]} />
                <pointLight position={[-8, 6, -6]} intensity={0.3} color="#FFEEDD" />
              </Suspense>
            </Canvas>

            {/* 视图模式切换 */}
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

            {/* 地震状态指示 */}
            {isQuaking && (
              <div className="absolute top-3 right-3 bg-red-900/80 backdrop-blur-sm rounded-lg px-3 py-2 border border-red-500/40">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-red-300 text-xs font-bold">地震模拟中</span>
                </div>
                <div className="text-red-400/70 text-[10px] mt-1">
                  {earthquakePreset.label} | {elapsedDisplay.toFixed(1)}s
                </div>
              </div>
            )}

            {/* 应力热力图开关 */}
            {viewMode !== 'pointcloud' && (
              <div className="absolute bottom-3 right-3">
                <button
                  onClick={() => setShowStressHeatmap(!showStressHeatmap)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] backdrop-blur-sm transition-all ${
                    showStressHeatmap
                      ? 'bg-red-900/60 text-red-300 border border-red-500/40'
                      : 'bg-black/60 text-gray-400 border border-gray-700 hover:text-imperial-gold hover:border-imperial-gold/40'
                  }`}
                >
                  {showStressHeatmap ? '应力云图 ON' : '应力云图 OFF'}
                </button>
              </div>
            )}

            {/* 点云模式说明 */}
            {viewMode === 'pointcloud' && (
              <div className="absolute bottom-3 left-3 right-3 bg-black/70 backdrop-blur-sm rounded-lg px-3 py-2">
                <p className="text-[11px] text-gray-300 leading-relaxed">
                  <span className="text-imperial-gold font-bold">SfM 稀疏重建</span>
                  {' '}— 基于多视图几何与三角化算法从照片恢复桥梁三维点云，用于校核赵州桥主拱、敞肩小拱与桥面几何关系。
                  <span className="text-blue-400"> 蓝色八面体</span> 标记相机位置，
                  <span className="text-red-400"> 红色线框</span> 为重建包围盒。
                </p>
              </div>
            )}
          </div>

          {/* 右侧控制面板 */}
          <div className="lg:col-span-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4 content-start">
            {/* 地震模拟控制 */}
            <div className={`gold-border rounded-lg p-3.5 bg-imperial-deeper/50 ${isQuaking ? 'ring-1 ring-red-500/30' : ''}`}>
              <h3 className="text-imperial-gold text-sm font-bold tracking-wider mb-2.5">
                地震模拟
              </h3>
              <div className="space-y-2.5">
                {/* 震级选择 */}
                <div className="grid grid-cols-2 gap-1.5">
                  {EARTHQUAKE_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => setEarthquakePreset(preset)}
                      disabled={isQuaking}
                      className={`px-2 py-1.5 rounded text-[11px] transition-all ${
                        earthquakePreset.id === preset.id
                          ? 'bg-red-900/40 text-red-300 border border-red-500/40 font-bold'
                          : 'border border-gray-700 text-gray-500 hover:border-red-500/30 hover:text-red-400 disabled:opacity-40'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                <div className="text-[10px] text-gray-500 bg-red-500/5 px-2 py-1.5 rounded">
                  {earthquakePreset.desc}
                </div>

                {/* 开始/停止按钮 */}
                <button
                  onClick={isQuaking ? stopEarthquake : startEarthquake}
                  className={`w-full py-2.5 rounded-lg text-sm font-bold transition-all ${
                    isQuaking
                      ? 'bg-red-800/60 text-red-200 border border-red-500/50 hover:bg-red-800/80'
                      : 'bg-gradient-to-r from-red-900/60 to-red-800/40 text-red-300 border border-red-600/30 hover:from-red-900/80 hover:to-red-800/60'
                  }`}
                >
                  {isQuaking ? '停止地震' : '开始地震模拟'}
                </button>

                {/* 实时安全指标 */}
                {(isQuaking || showStressHeatmap) && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-gray-500">峰值相对压应力</span>
                      <span className={`font-bold ${peakStress > 100 ? 'text-red-400' : peakStress > 70 ? 'text-yellow-400' : 'text-green-400'}`}>
                        {peakStress.toFixed(1)} / 120
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-gray-500">压力线贴合度</span>
                      <span className={`font-bold ${thrustLineFit < 80 ? 'text-red-400' : thrustLineFit < 88 ? 'text-yellow-400' : 'text-green-400'}`}>
                        {thrustLineFit.toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-200 ${
                          peakStress > 100 ? 'bg-red-500' : peakStress > 70 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(100, (peakStress / 120) * 100)}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-center mt-1">
                      {peakStress > 100 ? (
                        <span className="text-red-400">拱脚压应力和水平推力显著升高，仍以受压工作为主</span>
                      ) : peakStress > 70 ? (
                        <span className="text-yellow-400">1/4 跨与拱脚最敏感，敞肩小拱仍在帮助主拱调节压力线</span>
                      ) : (
                        <span className="text-green-400">主拱、敞肩小拱与桥台共同工作，受力分布接近论文描述</span>
                      )}
                    </div>
                    <div className="text-[10px] text-gray-500 leading-relaxed">
                      图中数值为基于论文结论构建的相对受力指标，用于展示受压分布趋势，不代表实桥实测 MPa。
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 荷载控制 */}
            <div className="gold-border rounded-lg p-3.5 bg-imperial-deeper/50">
              <h3 className="text-imperial-gold text-sm font-bold tracking-wider mb-2.5">载荷控制</h3>
              <div className="space-y-2.5">
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
                  type="range" min={0} max={100} value={load}
                  onChange={(e) => setLoad(Number(e.target.value))}
                  className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-imperial-gold"
                />
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

            {/* 动态应力分布图表 */}
            <div className="gold-border rounded-lg p-3.5 bg-imperial-deeper/50 md:col-span-2 lg:col-span-1">
              <h3 className="text-imperial-gold text-sm font-bold tracking-wider mb-2">
                应力分布
                {isQuaking && <span className="text-red-400 text-[10px] ml-2 animate-pulse">实时更新</span>}
              </h3>
              <ReactEChartsCore
                echarts={echarts}
                option={getDynamicStressChartOption(load, forcePosition, earthquakePreset.intensity, earthquakeTime, isQuaking)}
                style={{ height: 170 }}
                opts={{ renderer: 'canvas' }}
                notMerge
              />
              <p className="text-xs text-gray-500 mt-2 text-center">
                {isQuaking ? '地震作用下拱脚与 1/4 跨的压应力响应更敏感' : '点击桥面金色圆点可观察不同荷载位置下的受压转移'}
              </p>
            </div>

            {/* 桥梁信息卡片 */}
            <div className="gold-border rounded-lg p-3.5 bg-imperial-deeper/50">
              <h3 className="text-imperial-gold text-sm font-bold tracking-wider mb-2.5">桥梁档案</h3>
              <div className="space-y-1.5 text-xs">
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
              <div className="mt-2.5 pt-2.5 border-t border-imperial-gold/10">
                <p className="text-gray-400 text-xs leading-relaxed">
                  <span className="text-imperial-gold">敞肩拱创举：</span>
                  {BRIDGE_INFO.feature}
                </p>
              </div>
            </div>

            <div className="gold-border rounded-lg p-3.5 bg-imperial-deeper/50">
              <h3 className="text-imperial-gold text-sm font-bold tracking-wider mb-2.5">论文校正要点</h3>
              <div className="grid grid-cols-2 gap-2">
                {PAPER_METRICS.map((item) => (
                  <div key={item.label} className="rounded-lg border border-imperial-gold/10 bg-black/20 p-2.5">
                    <div className="text-[10px] text-gray-500">{item.label}</div>
                    <div className="text-imperial-gold font-bold text-sm mt-1">{item.value}</div>
                    <div className="text-[10px] text-gray-400 mt-1 leading-relaxed">{item.detail}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 底部地震波时程图 + 抗震解析 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-4">
          {/* 地震波加速度时程 */}
          <div className="lg:col-span-5 gold-border rounded-lg p-3.5 bg-imperial-deeper/50">
            <ReactEChartsCore
              echarts={echarts}
              option={getSeismicWaveChartOption(earthquakePreset.intensity, earthquakeTime, isQuaking)}
              style={{ height: 220 }}
              opts={{ renderer: 'canvas' }}
              notMerge
            />
            <div className="mt-2 text-[11px] text-gray-500 text-center">
              教学用地震输入时程（峰值加速度 = {(earthquakePreset.intensity * 9.8 * 0.6).toFixed(1)} m/s²），用于观察响应趋势而非复现实测地震记录。
            </div>
          </div>

          {/* 赵州桥抗震机理解析 */}
          <div className="lg:col-span-7 gold-border rounded-lg p-3.5 bg-imperial-deeper/50">
            <h3 className="text-imperial-gold text-sm font-bold tracking-wider mb-2.5">赵州桥抗震机理</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-gray-400 leading-relaxed">
              {PAPER_BASED_HIGHLIGHTS.map((item, index) => {
                const toneStyles: Record<string, string> = {
                  green: 'bg-green-900/40 text-green-400',
                  blue: 'bg-blue-900/40 text-blue-400',
                  yellow: 'bg-yellow-900/40 text-yellow-400',
                  red: 'bg-red-900/40 text-red-400',
                };

                return (
                  <div key={item.title} className="flex gap-2">
                    <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 mt-0.5 ${toneStyles[item.tone]}`}>
                      <span className="text-[10px] font-bold">{index + 1}</span>
                    </div>
                    <div>
                      <span className="text-imperial-gold font-bold">{item.title}：</span>
                      {item.body}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="gold-border rounded-lg p-3.5 bg-imperial-deeper/50 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-8">
              <h3 className="text-imperial-gold text-sm font-bold tracking-wider mb-2.5">展示模块中的论文依据</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                当前桥梁模块已按论文结论校正为“圆弧主拱 + 敞肩小拱 + 28 道并列拱券 + 桥台共同承受水平推力”的结构逻辑。
                页面中的云图、说明文字和指标卡均用于展示真实受力关系与受压主导特征，不再把赵州桥误写成普通实腹拱桥或现代隔震体系。
              </p>
            </div>
            <div className="lg:col-span-4">
              <div className="text-[11px] text-imperial-gold/80 mb-2">参考论文</div>
              <div className="space-y-2">
                {STRUCTURE_REFERENCES.map((item) => (
                  <div key={item} className="rounded-lg border border-imperial-gold/10 bg-black/20 px-3 py-2 text-[11px] text-gray-400 leading-relaxed">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BridgePage;
