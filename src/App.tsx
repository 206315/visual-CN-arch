import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import DouGongPage from './pages/DouGongPage';
import BridgePage from './pages/BridgePage';
import PalacePage from './pages/PalacePage';
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
        <Route path="/dougong" element={<DouGongPage />} />
        <Route path="/bridge" element={<BridgePage />} />
        <Route path="/palace" element={<PalacePage />} />
        <Route path="/sunmao" element={<SunmaoPage />} />
        <Route path="/timeline" element={<TimelinePage />} />
        <Route path="/ar" element={<ARPage />} />
      </Route>
    </Routes>
  );
}

export default App;
