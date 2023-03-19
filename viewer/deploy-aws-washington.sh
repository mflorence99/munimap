#!/bin/bash 

now=$(date)
echo "{ \"date\": \"$now\", \"id\": $RANDOM }" > lib/assets/build.json

version=${1:-patch}
message=${2:-"Prepare new version for release"}

git add . *
git commit -m "$message"

npm version $version

git push origin main

npm run build:viewer:washington

serverx-angular --app dist/viewer --deploy viewer/aws-washington.json
serverx-angular --app dist/viewer --deploy viewer/aws-washington-dpw.json
# serverx-angular --app dist/viewer --deploy viewer/aws-florence.json
