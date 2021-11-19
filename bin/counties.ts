import { bboxByAspectRatio } from './bbox';
import { theState } from '../lib/src/geojson';

import { mkdirSync } from 'fs';
import { readFileSync } from 'fs';
import { writeFileSync } from 'fs';

import chalk from 'chalk';

const dist = './dist/proxy';

const counties = JSON.parse(
  readFileSync(
    './proxy/assets/New_Hampshire_County_Boundaries.geojson'
  ).toString()
);

const wholeState: GeoJSON.Feature[] = [];

counties.features.forEach((feature: GeoJSON.Feature<any>) => {
  const county = (feature.properties.NAME as string).toUpperCase();

  console.log(
    chalk.green(`... writing ${theState}/${county}/boundary.geojson`)
  );

  // 👉 we don't need the properties, but we do need the bbox
  //    for printing, we want the aspect ratio to be 4:3 (or 3:4)
  //    with mesurements rounded up to the nearest mile
  feature.bbox = bboxByAspectRatio(feature, 4, 3, 'miles');
  feature.id = county;
  delete feature.properties;

  feature.properties = {
    name: county
  };

  // 👉 ouch! the source data uses MultiPolygon, we need Polygon
  if (feature.geometry.type === 'MultiPolygon') {
    feature.geometry.type = 'Polygon';
    feature.geometry.coordinates = feature.geometry.coordinates.flat(1);
  }

  // 👉 gather all the counties in one file
  wholeState.push(feature);

  const geojson: GeoJSON.FeatureCollection = {
    features: [feature],
    type: 'FeatureCollection'
  };

  // 👉 one file per county
  mkdirSync(`${dist}/${theState}/${county}`, { recursive: true });
  writeFileSync(
    `${dist}/${theState}/${county}/boundary.geojson`,
    JSON.stringify(geojson, null, 2)
  );
});

// 👉 one file for all towns
console.log(chalk.green(`... writing ${theState}/counties.geojson`));
const geojson: GeoJSON.FeatureCollection = {
  features: wholeState,
  type: 'FeatureCollection'
};
writeFileSync(
  `${dist}/${theState}/counties.geojson`,
  JSON.stringify(geojson, null, 2)
);
