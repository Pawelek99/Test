POSITIONAL=()
while [[ $# -gt 0 ]]; do
    key="$1"

    case $key in
    -h | --help | -help | h | help | ?)
        echo "Creates a issue with the given name."
        echo "Use this script instead of creating issues through the browser"
        echo "because this way the issue will be marked with the correct label and appropriate branch will be created and linked."
        echo "After creating issue you will be switched to the newly created branch."
        echo "Keep in mind that this branch automatically will be pushed."
        echo ""
        echo "Usage: ./$(basename "$0") [-h] 'Issue name' [-b -c] 'Label name'"
        echo "Options:"
        echo "  -h, --help, -help, h, help, ?   - displays this help message"
        echo "  -b, --bug                       - sets 'bug' label to the newly created issue"
        echo "  -c, --custom 'label'            - sets the given label to the newly created issue. Label have to exist."
        exit 0
        ;;
    --from)
        from="$2"
        shift # past argument
        shift # past value
        ;;
    -b | --bug)
        bug=1
        shift # past argument
        ;;
    -c | --custom)
        custom="$2"
        shift # past argument
        shift # past value
        ;;
    *)                     # unknown option
        POSITIONAL+=("$1") # save it in an array for later
        shift              # past argument
        ;;
    esac
done
set -- "${POSITIONAL[@]}"


echo "from      = $from"
echo "is bug    = $bug"
echo "custom    = $custom"
if [[ -n $1 ]]; then
    echo $1
fi
