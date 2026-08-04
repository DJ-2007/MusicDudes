@echo off
set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
set "PATH=C:\Program Files\Android\Android Studio\jbr\bin;%PATH%"
cd /d "d:\coding\Random Stuff\Music-With-Dudes\frontend\android"
call gradlew.bat assembleDebug --no-daemon
copy /Y "app\build\outputs\apk\debug\app-debug.apk" "..\..\MusicDudes.apk"
