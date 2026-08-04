@echo off
set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
set "PATH=C:\Program Files\Android\Android Studio\jbr\bin;%PATH%"
cd /d "%~dp0frontend\android"
call gradlew.bat --stop >nul 2>&1
call gradlew.bat assembleDebug --no-daemon -Dorg.gradle.java.home="C:\Program Files\Android\Android Studio\jbr"
if exist "%~dp0frontend\android\app\build\outputs\apk\debug\app-debug.apk" (
    copy /Y "%~dp0frontend\android\app\build\outputs\apk\debug\app-debug.apk" "%~dp0MusicDudes.apk" >nul
    echo.
    echo ========================================================
    echo SUCCESS! Your APK is ready:
    echo %~dp0MusicDudes.apk
    echo ========================================================
) else (
    echo.
    echo Build failed. Check output above.
)
