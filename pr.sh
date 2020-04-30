git --version > /dev/null || { echo "Nope. Install 'git' first: 'https://git-scm.com/book/en/v2/Getting-Started-Installing-Git'"; exit 1; }

hub --version > /dev/null || { echo "Nope. Install 'hub' first: 'https://github.com/github/hub'"; exit 1; }

issueId=$(git branch | grep \* | rev | cut -d 'i' -f1 | rev)
issueName=$(hub issue show -f "%t" $issueId)
label=$(hub issue show -f "%L" $issueId)

echo "Creating pull request for issue #$issueId with name $issueName, labeled: $label"

hub pull-request --copy -l $label -m "$issueName" -m "Close #$issueId" || exit 1

echo "Copied the pull request link to the clipboard"

[ "$1" == -m ] || [ "$1" == --master ] && git checkout master