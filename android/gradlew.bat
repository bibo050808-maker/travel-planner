@rem
@rem Gradle wrapper bat
@rem
@if "%DEBUG%"=="" @echo off
setlocal enabledelayedexpansion

set DIRNAME=%~dp0
if "%DIRNAME%"=="" set DIRNAME=.
set APP_HOME=%DIRNAME%

set GRADLE_VERSION=8.5
set WRAPPER_JAR=%APP_HOME%gradle\wrapper\gradle-wrapper.jar

if not exist "%WRAPPER_JAR%" (
    echo Downloading Gradle %GRADLE_VERSION%...
    powershell -Command "Invoke-WebRequest -Uri 'https://services.gradle.org/distributions/gradle-%GRADLE_VERSION%-bin.zip' -OutFile '%TEMP%\gradle.zip'; Expand-Archive -Path '%TEMP%\gradle.zip' -DestinationPath '%TEMP%\gradle-extract' -Force; Get-ChildItem '%TEMP%\gradle-extract\gradle-%GRADLE_VERSION%\lib\gradle-wrapper-*.jar' | Select-Object -First 1 | %%{ Copy-Item $_.FullName '%WRAPPER_JAR%' }; Remove-Item '%TEMP%\gradle.zip' -Force; Remove-Item '%TEMP%\gradle-extract' -Recurse -Force"
)

if exist "%WRAPPER_JAR%" (
    "%JAVA_HOME%/bin/java" -jar "%WRAPPER_JAR%" %*
) else (
    echo ERROR: Could not download Gradle wrapper. Install Java and Gradle manually.
    exit /b 1
)
