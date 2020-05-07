from=$(git rev-parse --abbrev-ref HEAD | rev | cut -d 'i' -f1 | rev)

positional=()
while [[ $# -gt 0 ]]; do
  key="$1"

  case $key in
  -h | --help | -help | h | help | ?)
    echo "Creates an issue with the given name and assignes it to you."
    echo "Use this script instead of creating issues through the browser"
    echo "because this way the issue will be marked with the correct label and appropriate branch will be created and linked."
    echo "After creating issue you will be switched to the newly created branch."
    echo "Keep in mind that this branch automatically will be pushed."
    echo ""
    echo "Usage:  ./$(basename "$0") [-h] <name> [-b|-c <label>] [--from <issue|'master'>] [-d]"
    echo "        ./$(basename "$0") open <issue>"
    echo "Options:"
    echo "  -h, --help, -help, h, help, ?   - displays this help message"
    echo "  -b, --bug                       - sets 'bug' label to the newly created issue"
    echo "  -c, --custom <label>            - sets the given label to the newly created issue. Label have to exist."
    echo "  --from <issue number|'master'>  - allows to choose a base branch by selecting base issue"
    echo "  -d, --detached                  - allows to create an issue without switching to the created branch"
    echo "  open <issue number>             - changes branch to the one associated with the given issue and assignes it to you"
    exit 0
    ;;
  --from)
    [[ -n $2 ]] || {
      echo "You have to pass an issue number"
      exit 1
    }
    from="$2"
    shift # past argument
    shift # past value
    ;;
  -b | --bug)
    bug=1
    shift # past argument
    ;;
  -c | --custom)
    [[ -n $2 ]] || {
      echo "You have to pass a label"
      exit 1
    }
    custom="$2"
    shift # past argument
    shift # past value
    ;;
  -d | --detached)
    detached=1
    shift # past argument
    ;;
  open)
    [[ -n $2 ]] || {
      echo "You have to pass an issue number"
      exit 1
    }
    open="$2"
    shift # past argument
    shift # past value
    ;;
  *)                   # unknown option
    positional+=("$1") # save it in an array for later
    shift              # past argument
    ;;
  esac
done
set -- "${positional[@]}"

git --version >/dev/null || {
  echo "Nope. Install 'git' first: 'https://git-scm.com/book/en/v2/Getting-Started-Installing-Git'"
  exit 1
}

hub --version >/dev/null || {
  echo "Nope. Install 'hub' first: 'https://github.com/github/hub'"
  exit 1
}

[[ -n $open ]] && {
  echo "Checking out branch associated with the selected issue"
  branch=$(hub issue show -f %b $open | cut -d "[" -f2 | cut -d "]" -f1)
  git stash
  git checkout --track origin/$branch
  git stash pop

  echo "Assigning this issue to you"

  assignee=$(hub api user | cut -d ',' -f1 | cut -d ':' -f2)

  hub issue update $open -a $assignee
  exit 0
}

[[ -n $1 ]] || {
  echo "You have to pass an issue title as a parameter"
  exit 1
}

if [[ -n $custom ]]; then
  IFS=' ' read -r -a labels <<<$(hub issue labels | sed ':a;N;$!ba;s/\n/ /g')
  (for e in "${labels[@]}"; do [[ $custom == $e ]] && exit 0; done) || {
    array=$(printf ", %s" "${labels[@]}")
    echo "You have to provide a label from: [${array[@]:2}]"
    exit 1
  }
  label=$custom
else
  [[ -n $bug ]] && label="bug" || label="feature"
fi

echo "Creating issue with name: '$1', labeled: $label"

[[ -n $detached ]] || {
  echo "Assigning this issue to you"

  assignee=$(hub api user | cut -d ',' -f1 | cut -d ':' -f2)
  assignee=" -a ${assignee//\"/' '}"
}

issueNumber=$(hub issue create -l "$label" -m "$1" $assignee | rev | cut -d "/" -f1 | rev)
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

[ "$from" == "master" ] && startingBranch=master || {
  startingBranch=$(hub issue show -f %b $from | cut -d "[" -f2 | cut -d "]" -f1)
}

git push origin origin/$startingBranch:refs/heads/$branchName >/dev/null

[[ -n $detached ]] || {
  git stash
  git checkout --track origin/$branchName
  git stash pop
}

link=$(hub browse -u | sed -r "s/[a-z0-9-]+$/$branchName/g")
description="Associated branch: [$branchName]($link)"
hub issue update "$issueNumber" -m "$1" -m "$description"