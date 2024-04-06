#!/bin/bash 

bin/bump-version.sh

npm run build:author

serverx-angular --app dist/author --deploy author/aws.json
