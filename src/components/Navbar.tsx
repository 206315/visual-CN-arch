import { useState } from 'react';
import { NavLink } from 'react-router-dom';

/** 导航菜单项定义 */
const NAV_ITEMS = [
  { path: '/', label: '首页', icon: '🏠' },
  { path: '/dougong', label: '斗拱解析', icon: '🏗️' },
  { path: '/bridge', label: '桥梁抗震', icon: '🌉' },
  { path: '/palace', label: '皇宫游览', icon: '🏯' },
  { path: '/siheyuan', label: '四合院', icon: '🏡' },
  { path: '/sunmao', label: '榫卯力学', icon: '🔧' },
  { path: '/timeline', label: '建筑演化', icon: '📜' },
  { path: '/ar', label: 'AR体验', icon: '📱' },
];

/**
 * 顶部导航栏组件
 * 中式暗黑风格，金色装饰线条，响应式移动端菜单
 */
function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-imperial-deeper/90 backdrop-blur-md border-b border-imperial-gold/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo 区域 */}
          <NavLink to="/" className="flex items-center gap-3 group">
            <span className="text-2xl">🏛️</span>
            <div>
              <h1 className="text-imperial-gold font-bold text-lg tracking-wider group-hover:animate-glow transition-all">
                匠心永驻
              </h1>
              <p className="text-imperial-gold/40 text-[10px] tracking-[0.3em] -mt-1">
                ANCIENT ARCHITECTURE
              </p>
            </div>
          </NavLink>

          {/* 桌面端导航链接 */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `px-4 py-2 rounded text-sm tracking-wider transition-all duration-300 ${
                    isActive
                      ? 'text-imperial-gold bg-imperial-gold/10 border border-imperial-gold/30'
                      : 'text-gray-400 hover:text-imperial-gold hover:bg-imperial-gold/5'
                  }`
                }
              >
                <span className="mr-1.5">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </div>

          {/* 移动端菜单按钮 */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden text-imperial-gold p-2"
            aria-label="切换菜单"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* 移动端下拉菜单 */}
      {mobileOpen && (
        <div className="md:hidden bg-imperial-deeper/95 backdrop-blur-md border-t border-imperial-gold/10">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `block px-6 py-3 text-sm tracking-wider border-b border-imperial-gold/5 transition-all ${
                  isActive
                    ? 'text-imperial-gold bg-imperial-gold/10'
                    : 'text-gray-400 hover:text-imperial-gold'
                }`
              }
            >
              <span className="mr-2">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </div>
      )}
    </nav>
  );
}

export default Navbar;
