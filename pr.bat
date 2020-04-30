@echo off
git --version > NUL || (echo Nope. Install 'git' first: 'https://git-scm.com/book/en/v2/Getting-Started-Installing-Git' && EXIT /B 1)

hub --version > NUL || (echo Nope. Install 'hub' first: 'https://github.com/github/hub' && EXIT /B 1)

FOR /F %%v IN ('git rev-parse --abbrev-ref HEAD') DO SET branchName=%%v

SET x=%branchName:i= && SET issueId=%

FOR /F "tokens=*" %%v IN ('hub issue show -f "%%t" "%issueId%"') DO SET issueName=%%v

FOR /F "tokens=*" %%v IN ('hub issue show -f "%%L" "%issueId%"') DO SET label=%%v

echo Creating pull request for issue #%issueId% with name "%issueName%", labeled: "%label%"

hub pull-request --copy -l "%label%" -m "%issueName%" -m "Close #%issueId%" || EXIT /B 1

echo Copied the pull request link to the clipboard

IF "%~1"=="-m" git checkout master
If "%~1"=="--master" git checkout master