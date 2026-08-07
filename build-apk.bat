@echo off
title Building MusicDudes APK...
echo ========================================================
echo   MusicDudes - Standalone Native APK Builder
echo ========================================================
echo.

powershell -ExecutionPolicy Bypass -Command "$env:JAVA_HOME='C:\Program Files\Android\Android Studio\jbr'; $env:PATH='C:\Program Files\Android\Android Studio\jbr\bin;' + $env:PATH; cd 'frontend'; npx.cmd cap copy android; cd 'android'; .\gradlew.bat assembleDebug --no-daemon; Copy-Item 'app\build\outputs\apk\debug\app-debug.apk' '..\..\MusicDudes.apk' -Force"

echo.
if exist "MusicDudes.apk" (
    echo ========================================================
    echo   SUCCESS! Standalone Native APK Built Successfully!
    echo   Location: %~dp0MusicDudes.apk
    echo ========================================================
) else (
    echo ========================================================
    echo   BUILD ERROR: APK generation failed.
    echo ========================================================
)
