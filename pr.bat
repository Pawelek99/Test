@echo off

IF "%~1"=="-h" SET help=1
IF "%~1"=="--help" SET help=1
IF "%~1"=="-help" SET help=1
IF "%~1"=="h" SET help=1
IF "%~1"=="help" SET help=1
IF "%~1"=="?" SET help=1

IF "%help%" == "1" (
    echo Creates a pull request from the current branch to the master branch.
    echo Use this script instead of creating PR through the browser
    echo because this way the PR will be marked with the correct label and appropriate issue will be linked.
    echo.
    echo Usage: ./%~0 [-h -d -m --to <issue>]
    echo Options:
    echo   -h, --help, -help, h, help, ?   - displays this help message
    echo   -d, --draft                     - marks newly created pull request as a draft
    echo   -m, --master                    - switches you to the master branch after creating a pull request
    echo   --to <issue number>             - allows to choose a branch to be merged to by selecting an issue
    EXIT /B 0
)

git --version > NUL || (echo Nope. Install 'git' first: 'https://git-scm.com/book/en/v2/Getting-Started-Installing-Git' && EXIT /B 1)

hub --version > NUL || (echo Nope. Install 'hub' first: 'https://github.com/github/hub' && EXIT /B 1)

FOR /F %%v IN ('git rev-parse --abbrev-ref HEAD') DO SET branchName=%%v

SET x=%branchName:i= && SET issueId=%

FOR /F "tokens=*" %%v IN ('hub issue show -f "%%t" "%issueId%"') DO SET issueName=%%v

FOR /F "tokens=*" %%v IN ('hub issue show -f "%%L" "%issueId%"') DO SET label=%%v

echo Creating pull request for issue #%issueId% with name "%issueName%", labeled: "%label%"

IF "%~1"=="-d" SET draft=1
IF "%~1"=="--draft" SET draft=1

IF "%draft%" == "1" (
    echo Marking pull request as a draft
    hub pull-request --copy -l "%label%" -m "%issueName%" -m "Close #%issueId%" -d 2> NUL || (echo We encountered some problems && EXIT /B 1)
) ELSE (
    hub pull-request --copy -l "%label%" -m "%issueName%" -m "Close #%issueId%" 2> NUL || (echo We encountered some problems && EXIT /B 1)
)

echo Copying the pull request link to the clipboard if we find the clipboard utilities

IF "%~1"=="-m" git checkout master
If "%~1"=="--master" git checkout master