@echo off

net file 1>NUL 2>NUL
IF not '%errorlevel%' == '0' (
    powershell Start-Process -FilePath "%0" -ArgumentList "%cd%" -verb runas >NUL 2>&1
    EXIT /b
)
cd /d %1

(hub --version >NUL 2>NUL && echo Don't play stupid. You already did it. Remember? && PAUSE) || (
    echo You don't have 'hub' on your machine :(
    echo Let me install that thing for you, my dear.
    echo.
    echo Ok, let's begin

    (choco --version >NUL 2>NUL && choco install hub -y) || (
        powershell "Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1')); refreshenv; choco install hub -y"
    )

    echo.
    echo Thanks for staying. Love you <3

    PAUSE
)