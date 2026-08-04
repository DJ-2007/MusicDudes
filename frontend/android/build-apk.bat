@echo off
set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
set "PATH=C:\Program Files\Android\Android Studio\jbr\bin;%PATH%"
cd /d "%~dp0"
call gradlew.bat assembleDebug --no-daemon
if exist "%~dp0app\build\outputs\apk\debug\app-debug.apk" (
    copy /Y "%~dp0app\build\outputs\apk\debug\app-debug.apk" "%~dp0..\..\MusicDudes.apk"
    echo.
    echo ========================================================
    echo SUCCESS! Your APK is ready:
    echo d:\coding\Random Stuff\Music-With-Dudes\MusicDudes.apk
    echo ========================================================
) else (
    echo.
    echo Build finished. APK path checked.
)
