# 🏛️ 匠心永驻 —— 中国古代建筑成就互动叙事可视化系统

<p align="center">
  <img src="public/pwa-192x192.png" alt="匠心永驻 Logo" width="120">
</p>

<p align="center">
  <a href="https://github.com/206315/visual-CN-arch/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License">
  </a>
  <a href="https://react.dev/">
    <img src="https://img.shields.io/badge/React-18.3-61DAFB.svg?logo=react&logoColor=white" alt="React">
  </a>
  <a href="https://www.typescriptlang.org/">
    <img src="https://img.shields.io/badge/TypeScript-5.4-3178C6.svg?logo=typescript&logoColor=white" alt="TypeScript">
  </a>
  <a href="https://vitejs.dev/">
    <img src="https://img.shields.io/badge/Vite-5.2-646CFF.svg?logo=vite&logoColor=white" alt="Vite">
  </a>
  <a href="https://threejs.org/">
    <img src="https://img.shields.io/badge/Three.js-0.163-000000.svg?logo=three.js&logoColor=white" alt="Three.js">
  </a>
</p>

<p align="center">
  <b>探索千年建筑智慧，沉浸式体验中华古建筑之美</b>
</p>

---

## 📖 项目简介

"匠心永驻"是一个集**可视化展示、互动体验、AI讲解**于一体的中国古代建筑文化平台。项目涵盖100座真实中国古代建筑，通过3D星图、AR体验、物理仿真等多种形式，让用户身临其境地感受中华建筑文明的博大精深。

### 🌟 核心亮点

- 🏗️ **100座真实古建筑** —— 涵盖宫殿、寺庙、园林、楼阁、石窟、桥梁、民居等8大类别
- 🤖 **AI智能导览** —— 集成 DeepSeek 大模型，支持多轮对话深度讲解
- 🌌 **3D建筑星图** —— 螺旋星系布局，按历史影响力可视化呈现建筑集群
- 📱 **多端适配** —— 支持 Web、Android 原生应用、Electron 桌面端
- 🥽 **AR增强现实** —— 支持模型查看器 AR 体验（Android/Quest）
- ⚡ **物理仿真** —— 斗拱拆解、桥梁抗震、榫卯力学等互动实验

---

## 🎬 项目预览

### 建筑演化星图
<img src="docs/images/star-map.png" alt="建筑星图" width="100%">

### AI对话界面
<img src="docs/images/ai-chat.png" alt="AI对话" width="100%">

### AR体验
<img src="docs/images/ar-experience.png" alt="AR体验" width="100%">

---

## 🚀 功能模块

### 1. 🌟 建筑演化（核心功能）
以**3D螺旋星系**的形式展示100座中国经典古建筑：
- **影响因子算法**：根据历史地位、保存状况、文化价值计算影响力分值（1-10）
- **恒星色彩映射**：高影响力显示为蓝青色（热恒星），低影响力显示为红灰色（冷恒星）
- **AI深度讲解**：点击任意建筑光球，可调起 DeepSeek AI 进行多轮对话问答
- **详细信息面板**：显示建造年代、朝代、建筑类别、核心技术等元数据

**建筑分类（100座）：**
| 类别 | 数量 | 代表建筑 |
|------|------|----------|
| 🏛️ 宫殿与皇家建筑 | 10 | 故宫太和殿、布达拉宫、天坛祈年殿 |
| 🛕 寺庙与道观 | 20 | 白马寺、少林寺、佛光寺、大昭寺 |
| 🌳 园林建筑 | 15 | 拙政园、颐和园、个园、清晖园 |
| 🏯 楼阁与亭台 | 15 | 黄鹤楼、滕王阁、岳阳楼、钟鼓楼 |
| 🗿 塔窟与石窟 | 10 | 莫高窟、龙门石窟、应县木塔、大雁塔 |
| 🌉 桥梁与水利 | 10 | 赵州桥、卢沟桥、广济桥、洛阳桥 |
| 🏠 民居与村落 | 10 | 四合院、福建土楼、乔家大院、窑洞 |
| 🏰 其他经典建筑 | 10 | 万里长城、西安城墙、武侯祠 |

### 2. 🔧 斗拱解析
交互式斗拱结构拆解与力学演示：
- **3D可视化**：七踩、五踩、偷心造、计心造等斗拱形制
- **拆解动画**：逐步展示斗、拱、昂、枋的组合方式
- **力学原理**：标注受力点和承重机制

### 3. 🌉 桥梁抗震
基于物理引擎的桥梁抗震模拟：
- **多种桥型**：梁桥、拱桥、索桥、浮桥
- **地震模拟**：可调节震级和频率
- **结构应力**：实时显示各部位受力情况
- **破坏分析**：展示不同抗震设计的差异

### 4. 🏰 皇宫游览
虚拟漫步明清皇宫：
- **第一人称视角**：沉浸式游览紫禁城
- **空间标注**：重要建筑热点提示
- **历史场景**：还原不同朝代的宫廷布局

### 5. 🔩 榫卯力学
中国传统木工技艺可视化：
- **常见榫卯类型**：燕尾榫、穿带榫、格肩榫、粽角榫等
- **力学仿真**：拉力、压力、扭力测试
- **拆装演示**：动态展示榫卯的连接与分离

### 6. 📱 AR体验（Android/Quest）
基于 WebXR 和 model-viewer 的增强现实功能：
- **建筑模型查看**：缩放、旋转、拆解
- **AR场景叠加**：将古建筑模型投射到现实环境
- **空间锚定**：支持模型在空间中固定位置

---

## 🤖 AI 智能导览

项目深度集成 **DeepSeek 大语言模型**，提供专业的古建筑知识问答服务。

### 功能特性
- 💬 **多轮对话**：支持连续追问，AI 记住上下文
- 🎯 **专业解答**：基于建筑学、历史学专业知识回答
- 📝 **智能总结**：自动生成建筑的历史背景、结构特点、保护现状
- ⌨️ **快捷交互**：支持 Enter 发送、Shift+Enter 换行

### 使用方式
1. 点击星图中的任意建筑光球
2. 在详情面板点击"🤖 向AI提问获取详细介绍"
3. 在对话框中查看 AI 生成的详细介绍
4. 可在输入框中继续追问相关问题

### 示例对话
```
用户：请详细介绍一下「北京故宫太和殿」
AI：太和殿，俗称"金銮殿"，位于北京紫禁城南北主轴线的显要位置...

用户：太和殿的屋顶有什么特别之处？
AI：太和殿采用重檐庑殿顶，是中国古建屋顶等级的最高形制...

用户：现在还能进去参观吗？
AI：目前太和殿内部不对外开放参观，游客可以在殿外观赏...
```

---

## 🛠️ 技术架构

### 前端技术栈
| 技术 | 版本 | 用途 |
|------|------|------|
| **React** | 18.3.1 | UI 框架 |
| **TypeScript** | 5.4.5 | 类型系统 |
| **Vite** | 5.2.11 | 构建工具 |
| **Three.js** | 0.163.0 | 3D 渲染 |
| **React Three Fiber** | 8.16.0 | React 3D 集成 |
| **React Force Graph 3D** | 1.29.1 | 3D 力导向图 |
| **Tailwind CSS** | 3.4.3 | 样式框架 |
| **GSAP** | 3.12.5 | 动画库 |
| **ECharts** | 5.5.0 | 数据可视化 |
| **Cannon-es** | 0.20.0 | 物理引擎 |

### 跨平台方案
| 平台 | 技术方案 | 说明 |
|------|----------|------|
| **Web** | Vite PWA | 渐进式Web应用，支持离线访问 |
| **Android** | Capacitor 8 | 原生应用包装，支持 WebView 和原生插件 |
| **Desktop** | Electron 41 | Windows/macOS/Linux 桌面应用 |
| **AR/VR** | WebXR + Model-Viewer | 支持 Android AR 和 Quest 设备 |

### 3D 可视化
- **Three.js**：核心 3D 渲染引擎
- **React Three Fiber**：React 生态的 Three.js 封装
- **React Force Graph 3D**：建筑星图的力导向布局
- **@react-three/drei**：Three.js 实用组件库
- **@google/model-viewer**：AR 模型查看器

### AI 集成
- **DeepSeek API**：大语言模型对话服务
- **流式响应**：支持打字机效果的流式输出（预留）
- **对话历史**：维护多轮对话上下文

---

## 📁 项目结构

```
visual-CN-arch/
├── 📂 src/
│   ├── 📂 components/          # 公共组件
│   │   ├── Layout.tsx          # 页面布局框架
│   │   ├── Navbar.tsx          # 导航栏组件
│   │   └── PointCloudBridge.tsx # 点云桥接组件
│   ├── 📂 pages/               # 页面组件
│   │   ├── TimelinePage.tsx    # 🌟 建筑演化星图（核心）
│   │   ├── DouGongPage.tsx     # 斗拱解析
│   │   ├── BridgePage.tsx      # 桥梁抗震
│   │   ├── PalacePage.tsx      # 皇宫游览
│   │   ├── SunmaoPage.tsx      # 榫卯力学
│   │   ├── ARPage.tsx          # AR体验
│   │   └── HomePage.tsx        # 首页
│   ├── 📂 types/               # TypeScript 类型定义
│   ├── App.tsx                 # 路由配置
│   ├── index.css               # 全局样式
│   └── main.tsx                # 应用入口
├── 📂 public/                  # 静态资源
│   ├── 📂 models/              # 3D模型文件
│   ├── 📂 images/              # 图片资源
│   └── manifest.json           # PWA配置
├── 📂 android/                 # Android原生工程（Capacitor生成）
├── 📂 electron/                # Electron桌面端代码
├── 📂 dist/                    # Web构建输出
├── 📂 docs/                    # 项目文档
├── 📄 package.json             # 项目依赖
├── 📄 vite.config.js           # Vite配置
├── 📄 capacitor.config.ts      # Capacitor配置
├── 📄 tailwind.config.js       # Tailwind配置
├── 📄 tsconfig.json            # TypeScript配置
└── 📄 README.md                # 项目说明
```

---

## 🚀 快速开始

### 环境要求
- **Node.js** >= 18.0.0
- **npm** >= 9.0.0 或 **yarn** >= 1.22.0
- **Git**

### 1. 克隆项目
```bash
git clone https://github.com/206315/visual-CN-arch.git
cd visual-CN-arch
```

### 2. 安装依赖
```bash
npm install
```

### 3. 配置 AI 服务（可选）
如需使用 AI 对话功能，在 `src/pages/TimelinePage.tsx` 中配置 DeepSeek API Key：
```typescript
const API_KEY = 'your-deepseek-api-key';
```

### 4. 启动开发服务器
```bash
npm run dev
```
访问 http://localhost:3000 查看项目。

---

## 📦 构建与部署

### Web 端（PWA）
```bash
npm run build
```
输出目录：`dist/`

### Android 应用
```bash
# 构建Web资源
npm run build

# 同步到Android工程
npx cap sync android

# 打开Android Studio
npx cap open android

# 或在项目根目录运行
build_apk.bat
```

### Electron 桌面端
```bash
# 开发模式
npm run electron:dev

# 构建安装包
npm run electron:build
```

### 静态部署
```bash
# 使用 serve 本地预览
npx serve dist

# 或使用项目提供的脚本
start_mobile_server.bat
```

---

## 🎯 技术亮点

### 1. 3D星图算法
- **螺旋星系布局**：基于影响因子的螺旋臂分布算法
- **动态大小调整**：根据相机距离自动调整节点大小，保持视觉一致性
- **恒星渲染**：多层光晕 + 核心高光，模拟真实恒星效果

### 2. 性能优化
- **PWA离线缓存**：使用 Service Worker 缓存静态资源
- **3D实例化**：大量节点渲染性能优化
- **懒加载**：路由级别代码分割
- **Tree Shaking**：剔除未使用的 Three.js 模块

### 3. 跨平台适配
- **响应式设计**：适配手机、平板、桌面多种屏幕
- **触摸优化**：针对移动端的手势交互优化
- **平台检测**：自动识别运行环境，启用对应功能

### 4. AI对话体验
- **对话历史管理**：维护多轮对话上下文
- **自动滚动**：新消息自动滚动到底部
- **加载状态**：打字动画和加载指示器
- **错误处理**：API故障时优雅降级

---

## 📚 数据说明

### 建筑数据来源
项目收录的100座建筑均来自真实历史文献和考古资料：
- **历史年代**：从东汉（公元68年白马寺）到现代复建
- **地理分布**：覆盖全国各省市及自治区
- **建筑类型**：涵盖官式建筑、宗教建筑、民居、园林、城防等

### 数据字段
```typescript
interface Building {
  id: number;              // 唯一标识
  name: string;            // 建筑名称
  year: number;            // 建造/重建年份
  dynasty: string;         // 所属朝代
  desc: string;            // 简要描述
  tech: string;            // 核心技术特点
  category: string;        // 建筑类别
  impactFactor: number;    // 影响因子（1-10）
  features: {              // 技术特征
    structureType: string; // 结构类型
    roofType?: string;     // 屋顶形式
    material: string[];    // 主要材料
    constructionTech: string[]; // 建造技术
  };
}
```

---

## 🔮 未来规划

- [ ] **建筑对比功能**：支持多座建筑的并排对比分析
- [ ] **时间轴游览**：按朝代演进展示建筑风格变迁
- [ ] **更多AI模型**：集成文心一言、通义千问等国产大模型
- [ ] **用户收藏**：登录系统和个人收藏夹
- [ ] **社区贡献**：开放建筑数据编辑接口
- [ ] **VR支持**：完整的虚拟现实游览体验
- [ ] **多语言**：英文、日文等多语言版本

---

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

### 提交规范
- **feat**: 新功能
- **fix**: 修复bug
- **docs**: 文档更新
- **style**: 代码格式调整
- **refactor**: 重构
- **test**: 测试相关
- **chore**: 构建/工具相关

### 开发流程
1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feat/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: Add some AmazingFeature'`)
4. 推送分支 (`git push origin feat/AmazingFeature`)
5. 创建 Pull Request

---

## 📄 许可证

本项目基于 [MIT License](LICENSE) 开源。

---

## 🙏 致谢

- **Three.js Community**：优秀的3D图形库
- **React Team**：出色的前端框架
- **DeepSeek**：强大的AI对话能力
- **Google Model Viewer**：便捷的AR解决方案
- **所有古建筑保护工作者**：守护中华建筑瑰宝

---

## 📬 联系方式

- **项目仓库**: https://github.com/206315/visual-CN-arch
- **问题反馈**: https://github.com/206315/visual-CN-arch/issues

<p align="center">
  <b>⭐ 如果这个项目对你有帮助，请点个 Star 支持一下！</b>
</p>

<p align="center">
  <i>匠心永驻，薪火相传</i>
</p>
