@echo off
set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
set "PATH=C:\Program Files\Android\Android Studio\jbr\bin;%PATH%"
cd /d "%~dp0frontend"
echo Syncing Capacitor assets...
call npx cap copy android
cd /d "%~dp0frontend\android"
echo Building Standalone Native APK...
call gradlew.bat assembleDebug --no-daemon
if exist "%~dp0frontend\android\app\build\outputs\apk\debug\app-debug.apk" (
    copy /Y "%~dp0frontend\android\app\build\outputs\apk\debug\app-debug.apk" "%~dp0MusicDudes.apk"
    echo.
    echo ========================================================
    echo SUCCESS! Standalone Capacitor Native APK is ready:
    echo %~dp0MusicDudes.apk
    echo ========================================================
) else (
    echo.
    echo Build failed. Check log output above.
)
