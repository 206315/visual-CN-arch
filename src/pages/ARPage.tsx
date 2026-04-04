import { useState, useEffect, useMemo } from 'react';
import QRCode from 'qrcode';

/* ========== AR 展品数据定义 ========== */
interface ARItem {
  id: string;
  name: string;
  desc: string;
  icon: string;
  modelSrc: string;
  poster: string;
  targetSrc: string;
}

const AR_ITEMS: ARItem[] = [
  {
    id: 'siheyuan',
    name: '四合院',
    desc: '中国传统合院式建筑，四面房屋围合而成，体现中国传统家族文化。',
    icon: '🏡',
    modelSrc: '/models/siheyuan.glb',
    poster: '',
    targetSrc: '/targets/siheyuan.png',
  },
  {
    id: 'bridge',
    name: '赵州桥',
    desc: '隋代李春设计建造的敞肩拱石桥，净跨37米，是世界上现存最古老的石拱桥。',
    icon: '🌉',
    modelSrc: '/models/stone bridge 3d model.glb',
    poster: '',
    targetSrc: '/targets/bridge.png',
  },
  {
    id: 'jiaolou',
    name: '故宫角楼',
    desc: '明永乐年间建造，九梁十八柱七十二脊，中国古代建筑艺术的巅峰之作。',
    icon: '🏯',
    modelSrc: '/models/jiaolou.glb',
    poster: '',
    targetSrc: '/targets/jiaolou.png',
  },
  {
    id: 'tower',
    name: '古塔',
    desc: '中国传统佛塔建筑，层层叠叠，气势恢宏。',
    icon: '🗼',
    modelSrc: '/models/tower.glb',
    poster: '',
    targetSrc: '/targets/tower.png',
  },
];

/**
 * 获取本机局域网IP
 */
function getLocalIP(): string {
  // 尝试从window.location获取
  const hostname = window.location.hostname;
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    return hostname;
  }
  // 如果是localhost，返回提示
  return 'localhost';
}

/**
 * AR体验页面（电脑端）
 * 展示展品列表和二维码，手机扫码后打开AR体验
 */
function ARPage() {
  const [activeItem, setActiveItem] = useState<ARItem>(AR_ITEMS[0]);
  const [qrCodes, setQrCodes] = useState<Record<string, string>>({});
  const [localIP, setLocalIP] = useState<string>('');
  const [port, setPort] = useState<string>('5173');

  // 生成二维码
  useEffect(() => {
    const ip = getLocalIP();
    setLocalIP(ip);
    
    // 尝试从URL获取端口
    const urlPort = window.location.port;
    if (urlPort) {
      setPort(urlPort);
    }

    const generateQRCodes = async () => {
      const codes: Record<string, string> = {};
      for (const item of AR_ITEMS) {
        const arUrl = `http://${ip}:${port}/ar-mobile/${item.id}`;
        try {
          const dataUrl = await QRCode.toDataURL(arUrl, {
            width: 200,
            margin: 2,
            color: {
              dark: '#D4AF37',
              light: '#000000',
            },
          });
          codes[item.id] = dataUrl;
        } catch (err) {
          console.error('生成二维码失败:', err);
        }
      }
      setQrCodes(codes);
    };

    generateQRCodes();
  }, [port]);

  // 当前选中展品的AR链接
  const currentARUrl = useMemo(() => {
    return `http://${localIP}:${port}/ar-mobile/${activeItem.id}`;
  }, [localIP, port, activeItem]);

  return (
    <div className="min-h-screen ink-bg">
      {/* 页面标题 */}
      <div className="text-center pt-8 pb-4 px-4">
        <h1 className="text-3xl md:text-4xl font-bold text-imperial-gold tracking-wider">
          AR 沉浸体验
        </h1>
        <p className="text-gray-500 text-sm mt-2 tracking-widest">
          选择展品 · 手机扫码 · 古建筑"走进"现实
        </p>
        <div className="chinese-divider max-w-xs mx-auto mt-4" />
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：3D预览区 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 3D模型预览 */}
            <div className="gold-border rounded-lg overflow-hidden bg-imperial-deeper/50">
              <div className="relative" style={{ height: '400px' }}>
                {/* @ts-ignore model-viewer 是 Web Component */}
                <model-viewer
                  src={activeItem.modelSrc}
                  alt={activeItem.name}
                  camera-controls
                  auto-rotate
                  shadow-intensity="1"
                  style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: '#0A0A0F',
                    '--poster-color': 'transparent',
                  } as React.CSSProperties}
                />
                {/* 覆盖层标签 */}
                <div className="absolute top-4 left-4 bg-imperial-deeper/80 backdrop-blur-sm px-4 py-2 rounded border border-imperial-gold/20">
                  <p className="text-imperial-gold text-sm font-bold">{activeItem.name}</p>
                  <p className="text-gray-500 text-[10px]">拖拽旋转 · 双指缩放</p>
                </div>
              </div>
            </div>

            {/* 展品介绍 */}
            <div className="gold-border rounded-lg p-6 bg-imperial-deeper/50">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">{activeItem.icon}</span>
                <h2 className="text-xl font-bold text-imperial-gold">{activeItem.name}</h2>
              </div>
              <p className="text-gray-400 leading-relaxed">{activeItem.desc}</p>
            </div>
          </div>

          {/* 右侧：选择面板和二维码 */}
          <div className="space-y-4">
            {/* 展品选择 */}
            <div className="gold-border rounded-lg p-4 bg-imperial-deeper/50">
              <h3 className="text-imperial-gold text-sm font-bold tracking-wider mb-3">🎯 选择展品</h3>
              <div className="space-y-2">
                {AR_ITEMS.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveItem(item)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all ${
                      activeItem.id === item.id
                        ? 'bg-imperial-gold/15 border border-imperial-gold/40'
                        : 'border border-transparent hover:bg-white/5 hover:border-imperial-gold/10'
                    }`}
                  >
                    <span className="text-2xl">{item.icon}</span>
                    <div>
                      <p className={`text-sm font-bold ${
                        activeItem.id === item.id ? 'text-imperial-gold' : 'text-gray-300'
                      }`}>
                        {item.name}
                      </p>
                      <p className="text-gray-500 text-[10px] mt-0.5 line-clamp-2">{item.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 二维码区域 */}
            <div className="gold-border rounded-lg p-4 bg-imperial-deeper/50">
              <h3 className="text-imperial-gold text-sm font-bold tracking-wider mb-3">📱 手机AR体验</h3>
              
              {/* 二维码显示 */}
              <div className="flex flex-col items-center">
                {qrCodes[activeItem.id] ? (
                  <div className="bg-white p-3 rounded-lg">
                    <img 
                      src={qrCodes[activeItem.id]} 
                      alt={`${activeItem.name} AR二维码`}
                      className="w-40 h-40"
                    />
                  </div>
                ) : (
                  <div className="w-40 h-40 bg-gray-800 rounded-lg flex items-center justify-center">
                    <span className="text-gray-500 text-xs">生成中...</span>
                  </div>
                )}
                
                <p className="text-center text-xs text-gray-400 mt-3">
                  手机扫码体验AR
                </p>
                
                {/* 网络信息 */}
                <div className="mt-3 p-2 bg-black/30 rounded text-xs text-gray-500 w-full">
                  <p>IP: {localIP || '检测中...'}</p>
                  <p>端口: {port}</p>
                  <p className="mt-1 text-[10px] text-gray-600 break-all">
                    {currentARUrl}
                  </p>
                </div>
              </div>
            </div>

            {/* AR Hiro标记 */}
            <div className="gold-border rounded-lg p-4 bg-imperial-deeper/50">
              <h3 className="text-imperial-gold text-sm font-bold tracking-wider mb-3">🎯 AR Hiro标记</h3>
              <div className="flex flex-col items-center">
                <div className="bg-white p-3 rounded-lg">
                  <img 
                    src="https://raw.githubusercontent.com/AR-js-org/AR.js/master/data/images/hiro.png" 
                    alt="Hiro AR标记"
                    className="w-40 h-40 object-contain"
                  />
                </div>
                <p className="text-center text-xs text-gray-400 mt-2">
                  手机扫码后，对准此 Hiro 标记
                </p>
                <p className="text-center text-[10px] text-gray-500 mt-1">
                  支持所有展品共用同一个标记
                </p>
              </div>
            </div>

            {/* AR 使用说明 */}
            <div className="gold-border rounded-lg p-4 bg-imperial-deeper/50">
              <h3 className="text-imperial-gold text-sm font-bold tracking-wider mb-3">📖 使用步骤</h3>
              <div className="space-y-2">
                {[
                  { step: '1', text: '确保手机和电脑在同一WiFi下' },
                  { step: '2', text: '选择想要查看的古建筑' },
                  { step: '3', text: '用手机扫描上方二维码' },
                  { step: '4', text: '允许摄像头权限，对准 Hiro 标记' },
                  { step: '5', text: '古建筑将出现在标记上方' },
                ].map((item) => (
                  <div key={item.step} className="flex items-start gap-2">
                    <span className="text-imperial-gold font-bold text-xs bg-imperial-gold/10 rounded w-5 h-5 flex items-center justify-center shrink-0">
                      {item.step}
                    </span>
                    <p className="text-gray-400 text-xs leading-relaxed">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 技术说明 */}
            <div className="gold-border rounded-lg p-4 bg-imperial-deeper/50">
              <h3 className="text-imperial-gold text-sm font-bold tracking-wider mb-3">⚙️ 技术说明</h3>
              <div className="space-y-2 text-xs text-gray-400 leading-relaxed">
                <p>
                  AR功能基于 Google <span className="text-imperial-gold">&lt;model-viewer&gt;</span>，
                  支持 Android（ARCore）和 iOS（ARKit）。
                </p>
                <p>
                  本地测试时请使用 <span className="text-imperial-gold">npm run dev -- --host</span> 启动服务。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ARPage;
