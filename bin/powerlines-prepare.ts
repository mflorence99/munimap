import { simplify } from '../lib/src/common';
import { theState } from '../lib/src/common';

import * as turf from '@turf/turf';

import { readFileSync } from 'fs';
import { writeFileSync } from 'fs';

import booleanIntersects from '@turf/boolean-intersects';

// 🔥 this is NOT the code to create the powerlines.geojson files
//    it simply extracts the NH data from the national dataset

// 👇 sucks we have to read the data from this downloaded file
//    but NH doesn't have anything useful and we downloaded this
//    from the URL below -- perhaps the PUC has something?
//    we can't commit this file because it is too large

// 👉 https://hifld-geoplatform.opendata.arcgis.com/datasets/electric-power-transmission-lines/explore

const powerlines = JSON.parse(
  readFileSync(
    '/home/mflo/Downloads/Electric_Power_Transmission_Lines.geojson'
  ).toString()
);

const dist = './data';

const boundary = JSON.parse(
  readFileSync(`${dist}/${theState}/boundary.geojson`).toString()
);

const geojson = turf.featureCollection([]);

powerlines.features
  .filter((feature: GeoJSON.Feature<any, any>) =>
    booleanIntersects(feature, boundary)
  )
  .forEach((feature: GeoJSON.Feature<any, any>) =>
    geojson.features.push(feature)
  );

writeFileSync(
  `./proxy/assets/New_Hampshire_Electric_Power_Transmission_Lines.geojson`,
  JSON.stringify(simplify(geojson))
);
