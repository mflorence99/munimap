#!/bin/bash 

bin/bump-version.sh

npm run build:viewer:henniker

serverx-angular --app dist/viewer --deploy viewer/aws-moskey.json
