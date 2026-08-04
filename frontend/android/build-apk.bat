@echo off
set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
set "PATH=C:\Program Files\Android\Android Studio\jbr\bin;%PATH%"
cd /d "%~dp0"
call gradlew.bat --stop >nul 2>&1
call gradlew.bat assembleDebug --no-daemon -Dorg.gradle.java.home="C:\Program Files\Android\Android Studio\jbr"
if exist "%~dp0app\build\outputs\apk\debug\app-debug.apk" (
    copy /Y "%~dp0app\build\outputs\apk\debug\app-debug.apk" "%~dp0..\..\MusicDudes.apk" >nul
    echo.
    echo ========================================================
    echo SUCCESS! Your APK is ready:
    echo d:\coding\Random Stuff\Music-With-Dudes\MusicDudes.apk
    echo ========================================================
) else (
    echo.
    echo Build failed. Check output above.
)
