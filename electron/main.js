const { app, BrowserWindow } = require('electron');
const path = require('path');
const url = require('url');

function createWindow() {
  // 创建浏览器窗口
  const mainWindow = new BrowserWindow({
    width: 1600,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      // 在渲染进程中启用Node.js API，如果需要的话
      // nodeIntegration: true,
      // contextIsolation: false,
    },
    icon: path.join(__dirname, '../public/favicon.ico') // 设置应用图标
  });

  // 确定加载URL：开发时加载Vite服务器，生产时加载打包后的文件
  if (process.env.NODE_ENV === 'development') {
    // 开发模式：加载Vite开发服务器
    mainWindow.loadURL('http://localhost:3001');
    mainWindow.webContents.openDevTools();
  } else {
    // 生产模式：加载打包后的文件
    const indexPath = path.join(__dirname, '../dist/index.html');
    mainWindow.loadURL(url.format({
      pathname: indexPath,
      protocol: 'file:',
      slashes: true
    }));
    
    // 打开开发者工具以便调试（生产环境也暂时打开，方便排查问题）
    mainWindow.webContents.openDevTools();
  }

  // 监听加载错误
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription);
  });
}

// Electron应用就绪后执行
app.whenReady().then(() => {
  createWindow();

  // 适配macOS：当所有窗口关闭后，点击dock图标时重新创建窗口
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// 当所有窗口关闭时退出应用（Windows & Linux）
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
