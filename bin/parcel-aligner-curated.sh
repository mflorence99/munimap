#!/bin/bash 

cp ~/Downloads/washington-parcels.geojson ~/mflorence99/munimap/proxy/assets/washington-parcels.geojson

npm run proxy:parcels:curated

version=${1:-patch}
message=${2:-"Deploy with aligned parcels"}

git add . *
git commit -m "$message"

npm version $version

git push origin main

npm run serve:author
