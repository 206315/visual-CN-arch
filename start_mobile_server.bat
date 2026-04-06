@echo off
chcp 65001 >nul
echo.
echo ========================================
echo  匠心永驻 - AR古建筑体验手机部署服务器
echo ========================================
echo.

REM 检查是否已安装依赖
if not exist "node_modules" (
  echo 正在安装依赖...
  call npm install
)

REM 构建项目（如果dist目录不存在）
if not exist "dist" (
  echo 正在构建项目...
  call npm run build
)

REM 获取本机IP地址
echo 正在获取本机IP地址...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /C:"IPv4"') do (
  set "IP=%%a"
  goto :ip_found
)
:ip_found
set "IP=%IP:~1%"
echo.

REM 启动HTTP服务器（使用serve）
echo 启动本地服务器...
echo 本地访问: http://localhost:3000/
echo 手机访问: http://%IP%:3000/
echo.
echo 请确保手机与电脑在同一Wi-Fi网络
echo 在手机浏览器中打开上述地址即可体验AR功能
echo.
echo 按 Ctrl+C 停止服务器
echo ========================================
echo.

REM 启动serve服务器，监听所有网络接口
npx serve dist -l 3000 --cors