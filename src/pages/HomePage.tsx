import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';

/** 首页功能卡片数据 */
const FEATURES = [
  {
    title: '斗拱智慧',
    subtitle: '拆解与力学模拟',
    desc: '三维高精度斗拱模型，支持拖拽旋转、点击高亮榫卯结构，一键拆解动画演示，Cannon-es物理引擎模拟真实受力。',
    icon: '🏗️',
    path: '/dougong',
    accent: 'from-amber-900/40 to-imperial-gold/10',
  },
  {
    title: '赵州桥',
    subtitle: '千年抗震奥秘',
    desc: '敞肩拱桥结构三维可视化，力学应力分布热力图，交互式载荷模拟，揭秘1400年屹立不倒的工程智慧。',
    icon: '🌉',
    path: '/bridge',
    accent: 'from-emerald-900/40 to-imperial-jade/10',
  },
  {
    title: '故宫角楼',
    subtitle: '皇家建筑巅峰',
    desc: '九梁十八柱七十二脊的极致木构艺术，三维全景游览，了解中国古代皇家建筑的登峰造极之作。',
    icon: '🏯',
    path: '/palace',
    accent: 'from-red-900/40 to-imperial-red/10',
  },
  {
    title: 'AR体验',
    subtitle: '古建筑进入现实',
    desc: '手机扫码即可将斗拱、赵州桥、故宫角楼"放置"在真实空间中，360°沉浸式观赏中华建筑瑰宝。',
    icon: '📱',
    path: '/ar',
    accent: 'from-blue-900/40 to-blue-500/10',
  },
];

/**
 * 首页组件
 * 包含：英雄区域 + 功能卡片展示 + 项目介绍
 */
function HomePage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const ctx = gsap.context(() => {
      /* 英雄区域入场动画 */
      gsap.from('.hero-title', {
        y: 60,
        opacity: 0,
        duration: 1.2,
        ease: 'power3.out',
      });
      gsap.from('.hero-subtitle', {
        y: 40,
        opacity: 0,
        duration: 1,
        delay: 0.3,
        ease: 'power3.out',
      });
      gsap.from('.hero-desc', {
        y: 30,
        opacity: 0,
        duration: 0.8,
        delay: 0.6,
        ease: 'power3.out',
      });
      gsap.from('.hero-btn', {
        y: 20,
        opacity: 0,
        duration: 0.8,
        delay: 0.9,
        ease: 'power3.out',
      });

      /* 功能卡片交错入场 */
      gsap.from('.feature-card', {
        y: 60,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        delay: 1.2,
        ease: 'power3.out',
      });
    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={heroRef}>
      {/* ========== 英雄区域 ========== */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden ink-bg">
        {/* 装饰背景粒子 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-imperial-gold/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-imperial-red/5 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          {/* 装饰分隔线 */}
          <div className="flex items-center justify-center gap-4 mb-8 hero-subtitle">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-imperial-gold/60" />
            <span className="text-imperial-gold/60 text-sm tracking-[0.5em]">中国古代建筑成就</span>
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-imperial-gold/60" />
          </div>

          {/* 主标题 */}
          <h1 className="hero-title text-5xl md:text-7xl font-black text-imperial-gold tracking-wider mb-6">
            匠心永驻
          </h1>

          {/* 副标题 */}
          <p className="hero-subtitle text-xl md:text-2xl text-imperial-paper/70 tracking-widest mb-4">
            榫卯一扣，千年不倒
          </p>

          {/* 描述文字 */}
          <p className="hero-desc text-gray-400 max-w-2xl mx-auto leading-relaxed mb-10 text-sm md:text-base">
            沉浸式互动可视化平台，让您亲手"拆解"中国古代建筑智慧。
            从斗拱的精妙榫卯，到赵州桥的千年抗震，再到故宫角楼的皇家气派——
            在指尖触碰间，感受跨越千年的中华匠心。
          </p>

          {/* 操作按钮 */}
          <div className="hero-btn flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate('/dougong')}
              className="px-8 py-3 bg-gradient-to-r from-imperial-gold to-imperial-bronze text-imperial-dark font-bold rounded tracking-wider hover:shadow-lg hover:shadow-imperial-gold/20 transition-all duration-300 hover:scale-105"
            >
              开始探索
            </button>
            <button
              onClick={() => {
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-8 py-3 border border-imperial-gold/40 text-imperial-gold rounded tracking-wider hover:bg-imperial-gold/10 transition-all duration-300"
            >
              了解更多
            </button>
          </div>
        </div>

        {/* 向下滚动提示 */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <svg className="w-6 h-6 text-imperial-gold/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* ========== 功能卡片区域 ========== */}
      <section id="features" className="py-20 px-4" ref={cardsRef}>
        <div className="max-w-6xl mx-auto">
          {/* 区域标题 */}
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-imperial-gold tracking-wider mb-4">
              四大核心体验
            </h2>
            <div className="chinese-divider max-w-xs mx-auto mb-4" />
            <p className="text-gray-500 tracking-wider text-sm">
              技术创新 · 文化传承 · 沉浸交互 · 教育普惠
            </p>
          </div>

          {/* 卡片网格 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {FEATURES.map((item) => (
              <div
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`feature-card group cursor-pointer gold-border p-8 rounded-lg bg-gradient-to-br ${item.accent} hover:scale-[1.02] transition-all duration-500`}
              >
                <div className="flex items-start gap-4">
                  <span className="text-4xl group-hover:scale-110 transition-transform duration-300">
                    {item.icon}
                  </span>
                  <div>
                    <h3 className="text-xl font-bold text-imperial-gold tracking-wider mb-1">
                      {item.title}
                    </h3>
                    <p className="text-imperial-gold/60 text-xs tracking-widest mb-3">
                      {item.subtitle}
                    </p>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
                {/* 进入箭头 */}
                <div className="mt-4 text-right">
                  <span className="text-imperial-gold/40 group-hover:text-imperial-gold group-hover:translate-x-2 inline-block transition-all duration-300 text-sm">
                    进入体验 →
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== 项目简介区域 ========== */}
      <section className="py-20 px-4 ink-bg">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-imperial-gold tracking-wider mb-6">
            关于本项目
          </h2>
          <div className="chinese-divider max-w-xs mx-auto mb-8" />
          <div className="gold-border p-8 rounded-lg text-left space-y-4">
            <p className="text-gray-300 leading-relaxed text-sm">
              <span className="text-imperial-gold font-bold">「匠心永驻」</span>
              是面向2026全国大学生计算机设计大赛的参赛作品，属于人工智能应用与信息可视化设计类别。
              本系统以"中国古代建筑成就"为主题，通过纯Web技术实现零安装、手机即用的沉浸式互动可视化平台。
            </p>
            <p className="text-gray-300 leading-relaxed text-sm">
              技术栈采用 React 18 + TypeScript + Three.js + Cannon-es 物理引擎 + ECharts + GSAP，
              首次将真实物理引擎应用于古代木结构力学可视化，把抽象古籍变为可玩可学的"活教材"。
            </p>
            <p className="text-gray-400 leading-relaxed text-sm">
              全部代码与3D资产均由大赛指定国产AI工具辅助生成并迭代优化，充分体现"AI辅助创作"理念。
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
