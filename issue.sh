git --version > /dev/null || { echo "Nope. Install 'git' first: 'https://git-scm.com/book/en/v2/Getting-Started-Installing-Git'"; exit 1; }

hub --version > /dev/null || { echo "Nope. Install 'hub' first: 'https://github.com/github/hub'"; exit 1; }

(($#)) > /dev/null || { echo "You have to pass an issue title as a parameter"; exit 1; }

if [ "$2" == -c ] || [ "$2" == --custom ]; then
    [[ ! -z $3 ]] || { echo "If you want to provide custom label, add third parameter"; exit 1; }
    IFS=' ' read -r -a labels <<< $(hub issue labels | sed ':a;N;$!ba;s/\n/ /g')
    ( for e in "${labels[@]}"; do [[ $3 == $e ]] && exit 0; done ) || { echo "You have to provide an existing label"; exit 1; }
    label=$3
else
    [[ "$2" == -b ]] || [[ "$2" == --bug ]] && label="bug" || label="feature"
fi

echo "Creating issue with name: '$1', labeled: $label"

issueNumber=$(hub issue create -l "$label" -m "$1" | rev | cut -d "/" -f1 | rev)

output="$1"

# Convert all chars to lowercase
output="$(echo "$output" | awk '{print tolower($0)}')"

# Remove all single quotes
output=$(echo "$output" | sed -r "s/'//g")

# Convert all non-alpha-numeric to dashes (-)
output=$(echo "$output" | sed -r "s/[^a-zA-Z0-9-]+/-/g")

# Replace multple dash occurances with singles
output="$(echo "$output" | sed -r 's/-+/-/g')"

# Remove trailing dashes
output="$(echo "$output" | sed -r 's/^-+|-+$//g')"

branchName="$output-i$issueNumber"

git checkout -b $branchName
git push --set-upstream origin $branchName

link=$(hub browse -u)
description="Associated branch: [$branchName]($link)"
hub issue update "$issueNumber" -m "$1" -m "$description"