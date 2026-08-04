@echo off
title Building MusicDudes APK...
echo ========================================================
echo   MusicDudes - Standalone Native APK Builder
echo ========================================================
echo.

set "ROOT_DIR=%~dp0"
set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
set "PATH=C:\Program Files\Android\Android Studio\jbr\bin;%PATH%"

cd /d "%ROOT_DIR%frontend"
echo [1/3] Syncing React build into Capacitor...
call npx.cmd cap copy android

cd /d "%ROOT_DIR%frontend\android"
echo.
echo [2/3] Stopping background processes...
call gradlew.bat --stop >nul 2>&1

echo.
echo [3/3] Compiling Native Android APK...
call gradlew.bat assembleDebug --no-daemon "-Dorg.gradle.java.home=C:/Program Files/Android/Android Studio/jbr"

echo.
if exist "%ROOT_DIR%frontend\android\app\build\outputs\apk\debug\app-debug.apk" (
    copy /Y "%ROOT_DIR%frontend\android\app\build\outputs\apk\debug\app-debug.apk" "%ROOT_DIR%MusicDudes.apk" >nul
    echo ========================================================
    echo   SUCCESS! Standalone Native APK Built Successfully!
    echo   Location: %ROOT_DIR%MusicDudes.apk
    echo ========================================================
) else (
    echo ========================================================
    echo   BUILD ERROR: Check the log output above.
    echo ========================================================
)
