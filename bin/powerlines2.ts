import { readFileSync } from 'fs';
import { writeFileSync } from 'fs';

import booleanIntersects from '@turf/boolean-intersects';

const powerlines = JSON.parse(
  readFileSync(
    '/home/mflo/Downloads/Electric_Power_Transmission_Lines.geojson'
  ).toString()
);

const state = 'NEW HAMPSHIRE';

const boundary = JSON.parse(
  readFileSync(`./dist/${state}/boundary.geojson`).toString()
);

const geojson: GeoJSON.FeatureCollection = {
  features: [],
  type: 'FeatureCollection'
};

powerlines.features
  .filter((feature: GeoJSON.Feature) => booleanIntersects(feature, boundary))
  .forEach((feature: GeoJSON.Feature) => geojson.features.push(feature));

writeFileSync(
  `./proxy/assets/New_Hampshire_Electric_Power_Transmission_Lines.geojson`,
  JSON.stringify(geojson, null, 2)
);