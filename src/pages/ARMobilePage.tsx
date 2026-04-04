import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';

interface ARItem {
  id: string;
  name: string;
  scale: number;
}

const AR_ITEMS: ARItem[] = [
  { id: 'siheyuan', name: '四合院', scale: 0.8 },
  { id: 'bridge', name: '赵州桥', scale: 0.6 },
  { id: 'jiaolou', name: '故宫角楼', scale: 0.7 },
  { id: 'tower', name: '古塔', scale: 0.7 },
];

function ARMobilePage() {
  const { modelId } = useParams<{ modelId: string }>();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [cameraReady, setCameraReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const item = AR_ITEMS.find((i) => i.id === modelId);

  const addDebug = (msg: string) => {
    setDebugInfo(prev => [...prev.slice(-4), msg]);
    console.log('[AR Debug]', msg);
  };

  useEffect(() => {
    if (!item) {
      setError('模型不存在');
      return;
    }

    addDebug('页面加载');
    addDebug('UserAgent: ' + navigator.userAgent.slice(0, 30));

    // 检查AR库加载
    let checkCount = 0;
    const checkARLoaded = () => {
      checkCount++;
      const hasAFrame = typeof (window as any).AFRAME !== 'undefined';
      const hasARjs = typeof (window as any).ARjs !== 'undefined';

      addDebug(`检查#${checkCount}: AFRAME=${hasAFrame}, ARjs=${hasARjs}`);

      if (hasAFrame && hasARjs) {
        addDebug('AR库已加载');
        startCamera();
      } else if (checkCount > 20) {
        addDebug('AR库加载超时');
        setError('AR库加载失败，请检查网络');
        setLoading(false);
      } else {
        setTimeout(checkARLoaded, 500);
      }
    };

    const startCamera = async () => {
      try {
        addDebug('请求摄像头...');
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });
        addDebug('摄像头已获取');

        // 等待video元素渲染
        let attempts = 0;
        const tryPlay = async () => {
          attempts++;
          if (videoRef.current) {
            try {
              videoRef.current.srcObject = stream;
              await videoRef.current.play();
              addDebug('视频播放成功');
              setCameraReady(true);
              setLoading(false);
            } catch (e: any) {
              addDebug('播放失败: ' + e.message);
              if (attempts < 5) {
                setTimeout(tryPlay, 500);
              } else {
                setError('视频播放失败');
                setLoading(false);
              }
            }
          } else {
            addDebug('等待video元素...');
            if (attempts < 10) {
              setTimeout(tryPlay, 300);
            } else {
              setError('video元素未找到');
              setLoading(false);
            }
          }
        };
        tryPlay();
      } catch (err: any) {
        addDebug('摄像头错误: ' + err.message);
        setError('摄像头启动失败: ' + err.message);
        setLoading(false);
      }
    };

    // 延迟检查，确保脚本有时间加载
    setTimeout(checkARLoaded, 1000);

    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [item]);

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white p-4">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <div className="text-xs text-gray-400 mb-4 text-left max-w-[300px]">
            {debugInfo.map((info, i) => (
              <div key={i}>{info}</div>
            ))}
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-imperial-gold text-black rounded"
          >
            刷新重试
          </button>
        </div>
      </div>
    );
  }

  // 根据模型ID返回对应的3D模型HTML
  const getModelHTML = () => {
    const scale = item?.scale || 0.5;
    const scaleStr = `${scale} ${scale} ${scale}`;

    switch (item?.id) {
      case 'siheyuan':
        return `
          <a-entity position="0 0 0" scale="${scaleStr}">
            <a-box position="0 0.4 -0.6" width="1.5" height="0.8" depth="0.6" color="#D4AF37"></a-box>
            <a-box position="0 0.3 0.6" width="1.5" height="0.6" depth="0.5" color="#D4AF37"></a-box>
            <a-box position="-0.8 0.25 0" width="0.5" height="0.5" depth="1" color="#D4AF37"></a-box>
            <a-box position="0.8 0.25 0" width="0.5" height="0.5" depth="1" color="#D4AF37"></a-box>
            <a-plane position="0 0.01 0" rotation="-90 0 0" width="1.2" height="1.2" color="#8B7355"></a-plane>
          </a-entity>
        `;
      case 'bridge':
        return `
          <a-entity position="0 0 0" scale="${scaleStr}">
            <a-box position="0 0.4 0" width="2.5" height="0.15" depth="0.8" color="#808080"></a-box>
            <a-torus position="0 0.2 0" radius="0.8" radius-tubular="0.15" arc="180" color="#696969"></a-torus>
          </a-entity>
        `;
      case 'jiaolou':
        return `
          <a-entity position="0 0 0" scale="${scaleStr}">
            <a-box position="0 0.15 0" width="1.2" height="0.3" depth="1.2" color="#8B4513"></a-box>
            <a-box position="0 0.6 0" width="1" height="0.6" depth="1" color="#D4AF37"></a-box>
            <a-box position="0 1.15 0" width="0.7" height="0.5" depth="0.7" color="#D4AF37"></a-box>
            <a-cone position="0 1.65 0" radius-bottom="0.6" radius-top="0" height="0.5" color="#8B0000"></a-cone>
            <a-sphere position="0 1.95 0" radius="0.1" color="#FFD700"></a-sphere>
          </a-entity>
        `;
      case 'tower':
        return `
          <a-entity position="0 0 0" scale="${scaleStr}">
            <a-cylinder position="0 0.15 0" radius="0.5" height="0.3" color="#8B4513"></a-cylinder>
            <a-cylinder position="0 0.9 0" radius="0.4" height="1.2" color="#D4AF37"></a-cylinder>
            <a-cone position="0 1.5 0" radius-bottom="0.5" radius-top="0.45" height="0.15" color="#8B0000"></a-cone>
            <a-cone position="0 1.85 0" radius-bottom="0.45" radius-top="0.4" height="0.15" color="#8B0000"></a-cone>
            <a-cone position="0 2.2 0" radius-bottom="0.4" radius-top="0.35" height="0.15" color="#8B0000"></a-cone>
            <a-cone position="0 2.6 0" radius-bottom="0.05" radius-top="0" height="0.4" color="#FFD700"></a-cone>
          </a-entity>
        `;
      default:
        return '<a-box position="0 0.5 0" color="#D4AF37"></a-box>';
    }
  };

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      {/* 调试信息 - 左上角 */}
      <div className="fixed top-2 left-2 z-50 bg-black/70 text-white text-xs p-2 rounded max-w-[200px]">
        {debugInfo.map((info, i) => (
          <div key={i}>{info}</div>
        ))}
        <div className="text-green-400">Camera: {cameraReady ? 'OK' : 'NO'}</div>
      </div>

      {/* 视频预览 - 使用contain保持比例 */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="fixed inset-0 w-full h-full z-0"
        style={{
          objectFit: 'contain',
          backgroundColor: 'black'
        }}
      />

      {/* AR场景 */}
      {cameraReady && (
        <div className="fixed inset-0 z-10">
          <a-scene
            embedded
            vr-mode-ui="enabled: false"
            arjs="sourceType: webcam; debugUIEnabled: false;"
            renderer="logarithmicDepthBuffer: true; alpha: true;"
            style={{ width: '100%', height: '100%' }}
          >
            {/* Hiro标记 */}
            <a-marker preset="hiro">
              <div dangerouslySetInnerHTML={{ __html: getModelHTML() }} />
            </a-marker>

            {/* 相机 */}
            <a-entity camera></a-entity>
          </a-scene>
        </div>
      )}

      {/* 加载提示 */}
      {loading && (
        <div className="fixed inset-0 z-20 bg-black/80 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-imperial-gold mx-auto mb-4"></div>
            <p className="text-white">正在启动AR...</p>
            <div className="text-xs text-gray-400 mt-4 text-left max-w-[300px]">
              {debugInfo.map((info, i) => (
                <div key={i}>{info}</div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 操作提示 */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none">
        <div className="bg-black/70 text-white px-4 py-2 rounded-full text-sm text-center">
          <p>📱 将摄像头对准 Hiro 标记</p>
          <p className="text-xs text-gray-300 mt-1">模型将出现在标记上方</p>
        </div>
      </div>

      {/* Hiro标记预览 */}
      <div className="fixed top-4 right-4 z-50 bg-white/10 backdrop-blur p-2 rounded">
        <img
          src="https://raw.githubusercontent.com/AR-js-org/AR.js/master/data/images/hiro.png"
          alt="Hiro Marker"
          className="w-16 h-16"
        />
        <p className="text-white text-xs text-center mt-1">扫描此标记</p>
      </div>
    </div>
  );
}

export default ARMobilePage;
