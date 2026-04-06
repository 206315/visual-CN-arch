@echo off
REM ==========================================================================
REM  匠心永驻 - 中国古代建筑成就互动叙事可视化系统 启动脚本
REM ==========================================================================

REM 设置窗口标题
title Ancient Architecture Viz - Dev Server

REM 切换到脚本所在目录，确保路径正确
cd /d "%~dp0"

echo.
echo ==========================================================================
echo. 	Starting Ancient Architecture Visualization Project
echo ==========================================================================
echo.

REM --- Environment Check ---
echo [INFO] Checking for Node.js and npm environment...

REM Check for Node.js
where node >nul 2>nul
IF %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not found in your system's PATH.
    echo [ACTION] Please install Node.js from https://nodejs.org/ and try again.
    pause
    exit /b
)

REM Check for npm
where npm >nul 2>nul
IF %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm (Node Package Manager) is not found. It should be installed with Node.js.
    echo [ACTION] Please try reinstalling Node.js from https://nodejs.org/ and try again.
    pause
    exit /b
)

echo [SUCCESS] Node.js and npm environment found.
echo.

REM --- Dependency Check ---
REM 检查 node_modules 是否存在
IF NOT EXIST "node_modules" (
    echo [INFO] 'node_modules' directory not found. Running 'npm install'...
    call npm install
    IF %ERRORLEVEL% NEQ 0 (
        echo [ERROR] 'npm install' failed. Please check your network connection and npm setup.
        pause
        exit /b
    )
    echo [SUCCESS] Dependencies installed successfully.
    echo.
)

REM --- Start Server ---
echo [INFO] Starting Vite development server...
echo [INFO] You can access the project at the 'Local' address shown below.
echo.

REM 启动 Vite 开发服务器
call npm run dev

echo.
echo ==========================================================================
echo. 	The development server has been stopped.
echo ==========================================================================
pause
