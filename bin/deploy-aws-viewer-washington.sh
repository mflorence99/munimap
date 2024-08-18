#!/bin/bash 

bin/bump-version.sh

npm run build:viewer:washington

serverx-angular --app dist/viewer --deploy viewer/aws-washington.json
serverx-angular --app dist/viewer --deploy viewer/aws-washington-dpw.json
# serverx-angular --app dist/viewer --deploy viewer/aws-florence.json
# serverx-angular --app dist/viewer --deploy viewer/aws-tcv-library.json
# serverx-angular --app dist/viewer --deploy viewer/aws-apdvd.json
