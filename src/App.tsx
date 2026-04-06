import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import DouGongPageEnhanced from './pages/DouGongPageEnhanced';
import BridgePage from './pages/BridgePage';
import PalacePage from './pages/PalacePage';
import SiheyuanPage from './pages/SiheyuanPage';
import ARPage from './pages/ARPage';
import TimelinePage from './pages/TimelinePage';
import SunmaoPage from './pages/SunmaoPage';

/**
 * 应用根组件
 * 路由结构：Layout 包裹所有页面，提供统一导航与布局
 */
function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/dougong" element={<DouGongPageEnhanced />} />
        <Route path="/dougong-enhanced" element={<Navigate to="/dougong" replace />} />
        <Route path="/bridge" element={<BridgePage />} />
        <Route path="/palace" element={<PalacePage />} />
        <Route path="/siheyuan" element={<SiheyuanPage />} />
        <Route path="/sunmao" element={<SunmaoPage />} />
        <Route path="/timeline" element={<TimelinePage />} />
        <Route path="/ar" element={<ARPage />} />
      </Route>
    </Routes>
  );
}

export default App;
