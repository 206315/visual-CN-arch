import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

/* ========== 点云数据类型（对应 bridge_pointcloud.json） ========== */
interface PointCloudData {
  meta: {
    totalPoints: number;
    sampledPoints: number;
    cameraCount: number;
    scaleFactor: number;
    targetSpan: number;
    description: string;
  };
  positions: number[];  // flat [x,y,z, x,y,z, ...]
  colors: number[];     // flat [r,g,b, r,g,b, ...] normalized 0-1
  cameras: Array<{
    center: number[];   // [x, y, z]
    dir: number[];      // [dx, dy, dz]
  }>;
}

/**
 * SfM 点云可视化组件
 * 基于 3D_reconstruction_of_bridge-master 中的稀疏重建数据
 * 技术参考：camera_visualalize_LiuHong.py、point_load.py、draw_on_3d.py
 */
export default function PointCloudBridge({ showCameras = true }: { showCameras?: boolean }) {
  const [data, setData] = useState<PointCloudData | null>(null);
  const pointsRef = useRef<THREE.Points>(null);

  /* 加载点云 JSON */
  useEffect(() => {
    fetch('/bridge_pointcloud.json')
      .then(r => r.json())
      .then((d: PointCloudData) => setData(d))
      .catch(e => console.error('点云数据加载失败:', e));
  }, []);

  /* 构建 BufferGeometry（参考 camera_visualalize_LiuHong.py 中的 PointCloud 构建方式） */
  const geometry = useMemo(() => {
    if (!data) return null;
    const geo = new THREE.BufferGeometry();
    const posArr = new Float32Array(data.positions);
    const colArr = new Float32Array(data.colors);
    geo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colArr, 3));
    return geo;
  }, [data]);

  /* 点材质 */
  const material = useMemo(() => {
    return new THREE.PointsMaterial({
      size: 0.08,
      vertexColors: true,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.85,
    });
  }, []);

  if (!data || !geometry) return null;

  return (
    <group scale={0.1}>
      {/* 点云渲染（对应 draw_on_3d.py 中的 draw_geometries） */}
      <points ref={pointsRef} geometry={geometry} material={material} />

      {/* SfM 相机位置可视化（对应 camera_visualalize_LiuHong.py 中的相机中心与朝向） */}
      {showCameras && data.cameras.map((cam, i) => (
        <group key={`cam-${i}`} position={cam.center as [number, number, number]}>
          {/* 相机位置点（蓝色，参考 Python 代码中 camera_color = [0,0,255]） */}
          <mesh>
            <octahedronGeometry args={[0.25, 0]} />
            <meshStandardMaterial
              color="#4488FF"
              emissive="#4488FF"
              emissiveIntensity={0.3}
              transparent
              opacity={0.7}
            />
          </mesh>
          {/* 朝向指示线 */}
          <arrowHelper
            args={[
              new THREE.Vector3(...cam.dir).normalize(),
              new THREE.Vector3(0, 0, 0),
              0.6,
              0x4488ff,
              0.15,
              0.1,
            ]}
          />
        </group>
      ))}

      {/* 包围盒（参考 draw_on_3d.py 中的 draw_box 方法） */}
      <BoundingBox positions={data.positions} />
    </group>
  );
}

/**
 * 包围盒线框（对应 draw_on_3d.py 中的 LineSet 包围盒绘制）
 */
function BoundingBox({ positions }: { positions: number[] }) {
  const geometry = useMemo(() => {
    /* 计算点云包围盒 */
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    for (let i = 0; i < positions.length; i += 3) {
      minX = Math.min(minX, positions[i]);     maxX = Math.max(maxX, positions[i]);
      minY = Math.min(minY, positions[i + 1]); maxY = Math.max(maxY, positions[i + 1]);
      minZ = Math.min(minZ, positions[i + 2]); maxZ = Math.max(maxZ, positions[i + 2]);
    }

    /* 8个顶点 + 12条边（与 draw_on_3d.py 中 draw_box 完全对应） */
    const x = minX, y = minY, z = minZ;
    const X = maxX, Y = maxY, Z = maxZ;
    const vertices = new Float32Array([
      x,y,z, X,y,z, x,Y,z, X,Y,z,
      x,y,Z, X,y,Z, x,Y,Z, X,Y,Z,
    ]);
    const indices = [0,1, 0,2, 1,3, 2,3, 4,5, 4,6, 5,7, 6,7, 0,4, 1,5, 2,6, 3,7];
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geo.setIndex(indices);
    return geo;
  }, [positions]);

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color="#DC143C" linewidth={1} transparent opacity={0.6} />
    </lineSegments>
  );
}
