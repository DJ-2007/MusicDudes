$env:JAVA_HOME = 'C:\Users\DELL\.jdks\jbr-21.0.11'
$env:PATH = "C:\Users\DELL\.jdks\jbr-21.0.11\bin;$env:PATH"

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  MusicDudes - Standalone Native APK Builder" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host " Syncing web assets with Capacitor..." -ForegroundColor Yellow
Set-Location "$rootDir\frontend"
& npx.cmd cap copy android

Write-Host ""
Write-Host " Compiling Android APK with Gradle (JBR 21)..." -ForegroundColor Yellow
Set-Location "$rootDir\frontend\android"
& 'C:\Users\DELL\.jdks\jbr-21.0.11\bin\java.exe' '-Dorg.gradle.java.home=C:\Users\DELL\.jdks\jbr-21.0.11' -classpath 'gradle/wrapper/gradle-wrapper.jar' org.gradle.wrapper.GradleWrapperMain assembleDebug --no-daemon

Write-Host ""
Write-Host " Copying APK to root directory..." -ForegroundColor Yellow
Set-Location $rootDir
$sourceApk = "$rootDir\frontend\android\app\build\outputs\apk\debug\app-debug.apk"
$targetApk = "$rootDir\MusicDudes.apk"

if (Test-Path $sourceApk) {
    Copy-Item -Path $sourceApk -Destination $targetApk -Force
    Write-Host "========================================================" -ForegroundColor Green
    Write-Host "  SUCCESS! Standalone Native APK Built Successfully!" -ForegroundColor Green
    Write-Host "  Location: $targetApk" -ForegroundColor Green
    $fileSize = (Get-Item $targetApk).Length
    Write-Host "  File Size: $fileSize bytes" -ForegroundColor Green
    Write-Host "========================================================" -ForegroundColor Green
} else {
    Write-Host "========================================================" -ForegroundColor Red
    Write-Host "  BUILD ERROR: APK generation failed." -ForegroundColor Red
    Write-Host "========================================================" -ForegroundColor Red
}
