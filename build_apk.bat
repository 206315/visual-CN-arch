@echo off
chcp 65001 >nul
echo.
echo ========================================
echo  匠心永驻 - Android APK 构建脚本
echo ========================================
echo.

REM 检查JAVA_HOME
if "%JAVA_HOME%"=="" (
    echo [错误] JAVA_HOME 环境变量未设置。
    echo.
    echo [解决方案] 请按以下步骤操作：
    echo 1. 下载并安装 Java JDK 8 或 11
    echo    下载地址: https://adoptium.net/temurin/releases/
    echo 2. 安装完成后，设置环境变量：
    echo    - 右键点击"此电脑" -> "属性"
    echo    - 点击"高级系统设置"
    echo    - 点击"环境变量"
    echo    - 在"系统变量"中新建变量：
    echo        变量名: JAVA_HOME
    echo        变量值: C:\Program Files\Eclipse Adoptium\jdk-11.0.xx.xx-hotspot
    echo    - 将 %JAVA_HOME%\bin 添加到 Path 变量中
    echo 3. 重新打开命令行窗口并再次运行此脚本
    echo.
    pause
    exit /b 1
)

REM 检查Java命令是否可用
java -version >nul 2>&1
if errorlevel 1 (
    echo [错误] Java命令不可用，请确保JAVA_HOME设置正确。
    echo 当前JAVA_HOME: %JAVA_HOME%
    echo.
    pause
    exit /b 1
)

echo [信息] Java环境检查通过。
echo.

REM 检查项目是否已构建
if not exist "dist" (
    echo [信息] 构建Web应用...
    call npm run build
    if errorlevel 1 (
        echo [错误] Web应用构建失败。
        pause
        exit /b 1
    )
)

REM 同步到Android项目
echo [信息] 同步到Android项目...
npx cap sync android
if errorlevel 1 (
    echo [错误] 同步失败。
    pause
    exit /b 1
)

REM 构建APK
echo [信息] 构建Android APK...
echo [注意] 这可能需要几分钟时间，请耐心等待...
echo.
npx cap build android
if errorlevel 1 (
    echo [错误] APK构建失败。
    echo.
    echo [解决方案] 可能的解决方法：
    echo 1. 确保Android SDK已安装
    echo 2. 运行以下命令手动构建：
    echo    cd android && gradlew.bat assembleDebug
    echo 3. 或使用Android Studio打开android文件夹进行构建
    echo.
    pause
    exit /b 1
)

echo.
echo [成功] APK构建完成！
echo.
echo APK文件位置：
echo   debug版本: android\app\build\outputs\apk\debug\app-debug.apk
echo   release版本: android\app\build\outputs\apk\release\app-release.apk
echo.
echo 您可以将APK文件复制到手机进行安装测试。
echo.
pause