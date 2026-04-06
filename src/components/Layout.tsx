import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import AncientArchitectureAssistant from './AncientArchitectureAssistant';

/**
 * 全局布局组件
 * 顶部固定导航 + 页面内容区域 + 底部版权信息
 */
function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-imperial-dark">
      {/* 顶部导航栏 */}
      <Navbar />

      {/* 页面内容区域 */}
      <main className="flex-1 pt-16">
        <div className="page-transition">
          <Outlet />
        </div>
      </main>

      <AncientArchitectureAssistant />

      {/* 底部版权区域 */}
      <footer className="border-t border-imperial-gold/20 py-6 text-center">
        <p className="text-imperial-gold/60 text-sm tracking-widest">
          匠心永驻 — 中国古代建筑成就互动可视化系统
        </p>
        <p className="text-gray-600 text-xs mt-2">
          2026 全国大学生计算机设计大赛参赛作品 · AI辅助创作
        </p>
      </footer>
    </div>
  );
}

export default Layout;
