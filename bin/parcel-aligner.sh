#!/bin/bash 

npm run proxy:parcel:aligner

cp ~/parcels.geojson ./data/'NEW HAMPSHIRE'/SULLIVAN/WASHINGTON/parcels.geojson 

version=${1:-patch}
message=${2:-"Deploy with aligned parcels"}

git add . *
git commit -m "$message"

npm version $version

git push origin main

npm run serve:author
