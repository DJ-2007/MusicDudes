@if "%DEBUG%"=="" @echo off
set "JAVA_HOME=C:\PROGRA~1\Android\ANDROI~1\jbr"
set "JAVA_EXE=C:\PROGRA~1\Android\ANDROI~1\jbr\bin\java.exe"
set "PATH=C:\PROGRA~1\Android\ANDROI~1\jbr\bin;C:\Program Files\nodejs;C:\Windows\system32;C:\Windows;C:\Windows\System32\Wbem"

if "%OS%"=="Windows_NT" setlocal
set "JAVA_HOME=C:\PROGRA~1\Android\ANDROI~1\jbr"
set "JAVA_EXE=C:\PROGRA~1\Android\ANDROI~1\jbr\bin\java.exe"
set "PATH=C:\PROGRA~1\Android\ANDROI~1\jbr\bin;C:\Program Files\nodejs;C:\Windows\system32;C:\Windows;C:\Windows\System32\Wbem"

set DIRNAME=%~dp0
if "%DIRNAME%"=="" set DIRNAME=.
set APP_BASE_NAME=%~n0
set APP_HOME=%DIRNAME%

for %%i in ("%APP_HOME%") do set APP_HOME=%%~fi

set DEFAULT_JVM_OPTS="-Xmx64m" "-Xms64m"
set GRADLE_OPTS=-Dorg.gradle.java.home=C:\PROGRA~1\Android\ANDROI~1\jbr %GRADLE_OPTS%
set JAVA_OPTS=-Dorg.gradle.java.home=C:\PROGRA~1\Android\ANDROI~1\jbr %JAVA_OPTS%

:execute
set CLASSPATH=%APP_HOME%\gradle\wrapper\gradle-wrapper.jar

"%JAVA_EXE%" %DEFAULT_JVM_OPTS% %JAVA_OPTS% %GRADLE_OPTS% "-Dorg.gradle.appname=%APP_BASE_NAME%" -classpath "%CLASSPATH%" org.gradle.wrapper.GradleWrapperMain %*

:end
if %ERRORLEVEL% equ 0 goto mainEnd

:fail
set EXIT_CODE=%ERRORLEVEL%
if %EXIT_CODE% equ 0 set EXIT_CODE=1
if not ""=="%GRADLE_EXIT_CONSOLE%" exit %EXIT_CODE%
exit /b %EXIT_CODE%

:mainEnd
if "%OS%"=="Windows_NT" endlocal

:omega
