@echo off
:: =================================================================================
::  匠心永驻 - 桌面版打包脚本 (管理员模式)
::  
::  重要：请右键点击此文件，选择“以管理员身份运行”
:: =================================================================================

:: 设置窗口标题
title Building Portable App (Admin Mode)

:: 切换到脚本所在目录
cd /d "%~dp0"

echo.
echo [INFO] Starting the application build process in Administrator Mode...
echo.

:: 检查 node_modules 是否存在
IF NOT EXIST "node_modules" (
    echo [INFO] 'node_modules' directory not found. Running 'npm install'...
    call npm install
    IF %ERRORLEVEL% NEQ 0 (
        echo [ERROR] 'npm install' failed. Please check your Node.js and npm setup.
        goto End
    )
    echo [SUCCESS] Dependencies installed successfully.
    echo.
)

:: 执行打包命令
echo [INFO] Building the portable desktop application...
echo [INFO] This may take a few minutes.
echo.
call npm run electron:build

IF %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Build failed. Please check the log above for details.
) ELSE (
    echo.
    echo [SUCCESS] Build completed successfully!
    echo [INFO] You can find the installer in the 'dist-desktop' directory.
)

:End
echo.
echo =================================================================================
echo Script finished. Press any key to exit.
pause >nul
