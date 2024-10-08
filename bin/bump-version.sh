#!/bin/bash 

echo $GITHUB_PAT

now=$(date)
echo "{ \"date\": \"$now\", \"id\": $RANDOM }" > lib/assets/build.json

version=${1:-patch}
message=${2:-"Prepare new version for release"}

git add . *
git commit -m "$message"

npm version $version

git push origin main
