import { bboxByAspectRatio } from './bbox';

import { mkdirSync } from 'fs';
import { readFileSync } from 'fs';
import { writeFileSync } from 'fs';

import chalk from 'chalk';

const towns = JSON.parse(
  readFileSync(
    './proxy/assets/New_Hampshire_Political_Boundaries.geojson'
  ).toString()
);

const dist = './dist/proxy';

const state = 'NEW HAMPSHIRE';

const townsByCounty: Record<string, GeoJSON.Feature[]> = {};
const wholeState: GeoJSON.Feature[] = [];

towns.features.forEach((feature: GeoJSON.Feature) => {
  const county = String(
    feature.properties.PB_TOWN_Census_2010_StatsCOUNTYNAME
  ).toUpperCase();

  const town = (feature.properties.pbpNAME as string).toUpperCase();

  console.log(
    chalk.green(`... writing ${state}/${county}/${town}/boundary.geojson`)
  );

  // 👉 we don't need the properties, but we do need the bbox
  //    for printing, we want the aspect ratio to be 4:3 (or 3:4)
  //    with mesurements rounded up to the nearest mile
  feature.bbox = bboxByAspectRatio(feature, 4, 3, 'miles');
  feature.id = town;
  delete feature.properties;

  feature.properties = {
    name: town
  };

  // 👉 gather all the towns in one file, then by county
  if (!townsByCounty[county]) townsByCounty[county] = [];
  townsByCounty[county].push(feature);
  wholeState.push(feature);

  const geojson: GeoJSON.FeatureCollection = {
    features: [feature],
    type: 'FeatureCollection'
  };

  // 👉 one directory, one file per town
  mkdirSync(`${dist}/${state}/${county}/${town}`, { recursive: true });
  writeFileSync(
    `${dist}/${state}/${county}/${town}/boundary.geojson`,
    JSON.stringify(geojson, null, 2)
  );
});

// 👉 one file for each county
Object.keys(townsByCounty).forEach((county) => {
  console.log(chalk.green(`... writing ${state}/${county}/towns.geojson`));
  const geojson: GeoJSON.FeatureCollection = {
    features: townsByCounty[county],
    type: 'FeatureCollection'
  };
  writeFileSync(
    `${dist}/${state}/${county}/towns.geojson`,
    JSON.stringify(geojson, null, 2)
  );
});

// 👉 one file for all towns
console.log(chalk.green(`... writing ${state}/towns.geojson`));
const geojson: GeoJSON.FeatureCollection = {
  features: wholeState,
  type: 'FeatureCollection'
};
writeFileSync(
  `${dist}/${state}/towns.geojson`,
  JSON.stringify(geojson, null, 2)
);
