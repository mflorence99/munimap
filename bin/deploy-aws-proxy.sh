#!/bin/bash 

npm run build:proxy
cp proxy/serverless.yml dist/proxy
cd dist/proxy
serverless deploy
