import { useState } from 'react';

/* ========== AR 展品数据定义 ========== */
interface ARItem {
  id: string;
  name: string;
  desc: string;
  icon: string;
  /* 实际项目中替换为真实 .glb 模型路径 */
  modelSrc: string;
  poster: string;
}

const AR_ITEMS: ARItem[] = [
  {
    id: 'dougong',
    name: '七铺作斗拱',
    desc: '宋代《营造法式》中记载的标准七铺作双抄双下昂斗拱，是中国古代建筑最精妙的结构发明。',
    icon: '🏗️',
    modelSrc: 'https://modelviewer.dev/shared-assets/models/Astronaut.glb',
    poster: '',
  },
  {
    id: 'bridge',
    name: '赵州桥',
    desc: '隋代李春设计建造的敞肩拱石桥，净跨37米，是世界上现存最古老的石拱桥。',
    icon: '🌉',
    modelSrc: 'https://modelviewer.dev/shared-assets/models/Astronaut.glb',
    poster: '',
  },
  {
    id: 'palace',
    name: '故宫角楼',
    desc: '明永乐年间建造，九梁十八柱七十二脊，中国古代建筑艺术的巅峰之作。',
    icon: '🏯',
    modelSrc: '/models/palace_corner_tower.glb',
    poster: '',
  },
];

/**
 * AR体验页面
 * 使用 Google model-viewer Web Component 实现 AR 预览
 * 注意：AR 功能需要 HTTPS + 支持 ARCore/ARKit 的移动设备
 */
function ARPage() {
  const [activeItem, setActiveItem] = useState<ARItem>(AR_ITEMS[0]);

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
          {/* 3D/AR 预览区 */}
          <div className="lg:col-span-2 gold-border rounded-lg overflow-hidden bg-imperial-deeper/50">
            <div className="relative" style={{ height: '500px' }}>
              {/* @ts-ignore model-viewer 是 Web Component */}
              <model-viewer
                src={activeItem.modelSrc}
                alt={activeItem.name}
                ar
                ar-modes="webxr scene-viewer quick-look"
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
                <p className="text-gray-500 text-[10px]">拖拽旋转 · 双指缩放 · 点击AR按钮投放</p>
              </div>
            </div>
          </div>

          {/* 右侧选择面板 */}
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

            {/* AR 使用说明 */}
            <div className="gold-border rounded-lg p-4 bg-imperial-deeper/50">
              <h3 className="text-imperial-gold text-sm font-bold tracking-wider mb-3">📱 AR 使用指南</h3>
              <div className="space-y-3">
                {[
                  { step: '01', text: '在手机浏览器中打开本页面（需HTTPS）' },
                  { step: '02', text: '选择想要查看的古建筑展品' },
                  { step: '03', text: '点击3D预览区右下角的AR图标' },
                  { step: '04', text: '将手机对准平坦表面，即可放置模型' },
                  { step: '05', text: '双指缩放/单指旋转，360°观赏建筑细节' },
                ].map((item) => (
                  <div key={item.step} className="flex items-start gap-3">
                    <span className="text-imperial-gold font-bold text-xs bg-imperial-gold/10 rounded px-1.5 py-0.5 shrink-0">
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
                  AR功能基于 Google <span className="text-imperial-gold">&lt;model-viewer&gt;</span> Web Component，
                  支持 Android（ARCore）和 iOS（ARKit Quick Look）。
                </p>
                <p>
                  当前使用占位模型用于演示。实际部署时将替换为高精度古建筑 .glb 模型文件，
                  模型由 AI 辅助生成并经人工精修。
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
