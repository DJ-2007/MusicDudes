@echo off
set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
set "PATH=C:\Program Files\Android\Android Studio\jbr\bin;%PATH%"

cd /d "%~dp0frontend"
echo Syncing web assets into Capacitor Android...
call npx.cmd cap copy android

cd /d "%~dp0frontend\android"
echo Stopping old Gradle daemons...
call gradlew.bat --stop >nul 2>&1

echo Compiling Standalone Native APK via Capacitor...
call gradlew.bat assembleDebug --no-daemon "-Dorg.gradle.java.home=C:/Program Files/Android/Android Studio/jbr"

if exist "%~dp0frontend\android\app\build\outputs\apk\debug\app-debug.apk" (
    copy /Y "%~dp0frontend\android\app\build\outputs\apk\debug\app-debug.apk" "%~dp0MusicDudes.apk" >nul
    echo.
    echo ========================================================
    echo SUCCESS! Standalone Capacitor Native APK is ready:
    echo %~dp0MusicDudes.apk
    echo ========================================================
) else (
    echo.
    echo ========================================================
    echo To build your APK in 1 click using Android Studio:
    echo 1. Open terminal in frontend directory
    echo 2. Run: npx cap open android
    echo 3. In Android Studio, click: Build - Build APKs
    echo ========================================================
)
