net file 1>NUL 2>NUL
IF not '%errorlevel%' == '0' (
    powershell Start-Process -FilePath "%0" -ArgumentList "%cd%" -verb runas >NUL 2>&1
    EXIT /b
)

cd /d %1

echo here
PAUSE