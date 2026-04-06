@echo off
:: =================================================================================
::  匠心永驻 - 桌面版打包脚本 (自动请求管理员权限)
:: =================================================================================

:: 1. 自动请求管理员权限
:: ---------------------------------------------------------------------------------
>nul 2>&1 "%SYSTEMROOT%\system32\cacls.exe" "%SYSTEMROOT%\system32\config\system"
if '%errorlevel%' NEQ '0' (
    echo [REQUEST] Requesting administrator privileges to create symbolic links...
    goto UACPrompt
) else ( goto gotAdmin )

:UACPrompt
    echo Set UAC = CreateObject^("Shell.Application"^) > "%temp%\getadmin.vbs"
    echo UAC.ShellExecute "%~s0", "", "", "runas", 1 >> "%temp%\getadmin.vbs"
    "%temp%\getadmin.vbs"
    exit /B

:gotAdmin
    if exist "%temp%\getadmin.vbs" ( del "%temp%\getadmin.vbs" )
    pushd "%CD%"
    CD /D "%~dp0"

:: =================================================================================
:: 2. 以管理员权限执行打包命令
:: =================================================================================

title Building Portable App (Admin Mode)

echo.
echo [SUCCESS] Administrator privileges acquired.
echo [INFO] Starting the application build process...
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
pause
