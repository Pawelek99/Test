@echo off
git --version > NUL || (echo Nope. Install 'git' first: 'https://git-scm.com/book/en/v2/Getting-Started-Installing-Git' && EXIT /B 1)

hub --version > NUL || (echo Nope. Install 'hub' first: 'https://github.com/github/hub' && EXIT /B 1)

IF "%~1"=="" echo You have to pass an issue title as a parameter && EXIT /B 1

IF "%~2"=="-c" SET custom=1
IF "%~2"=="--custom" SET custom=1

setlocal EnableDelayedExpansion

IF "%custom%"=="1" (
    IF "%~3"=="" echo If you want to provide custom label, add third parameter && EXIT /B 1
    SET labelCount=0
    FOR /F "delims=" %%v IN ('hub issue labels') do (
        SET /a labelCount+=1
        SET labels[%%v]=true
    )
    IF defined labels[%~3] (
        SET label=%3
    ) ELSE (
        echo You have to provide an existing label
        EXIT /B 1
    )
) ELSE (
    IF "%~2"=="-b" SET bug=1
    IF "%~2"=="--bug" SET bug=1

    IF "!bug!"=="1" (
        SET label=bug
    ) ELSE (
        SET label=feature
    )
)

echo Creating issue with name: '%~1', labeled: %label%

FOR /F %%v IN ('hub issue create -l "%label%" -m %1') DO SET issueLink=%%v

SET x=%issueLink:/= && SET issueNumber=%

SET output=%~1

REM Convert all chars to lowercase
FOR /F "usebackq delims=" %%v IN (`powershell "\"%output%\".toLower()"`) do SET output=%%v

REM Remove all single quotes
FOR /F "usebackq delims=" %%v IN (`powershell "\"%output%\" -replace \"'\""`) do SET output=%%v

REM Convert all non-alpha-numeric to dashes (-)
FOR /F "usebackq delims=" %%v IN (`powershell "\"%output%\" -replace '[^a-zA-Z0-9-]+','-'"`) do SET output=%%v

REM Replace multiple dash occurances with singles
FOR /F "usebackq delims=" %%v IN (`powershell "\"%output%\" -replace '-+','-'"`) do SET output=%%v

REM Remove trailing dashes
FOR /F "usebackq delims=" %%v IN (`powershell "\"%output%\" -replace '^-+|-+$',''"`) do SET output=%%v

SET branchName=%output%-i%issueNumber%

git checkout -b %branchName%
git push --set-upstream origin %branchName%