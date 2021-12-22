/* eslint-disable @typescript-eslint/naming-convention */

import { Features } from '../lib/src/geojson';

import { bboxByAspectRatio } from './bbox';
import { simplify } from '../lib/src/geojson';
import { theState } from '../lib/src/geojson';

import { mkdirSync } from 'fs';
import { readFileSync } from 'fs';
import { writeFileSync } from 'fs';

import chalk from 'chalk';

const loadem = (fn): Features => JSON.parse(readFileSync(fn).toString());

const towns = loadem(
  './proxy/assets/New_Hampshire_Political_Boundaries.geojson'
);

// 👇 some towns have hand-tweaked boundaries to try to perfectly align
//    them with the boundaries of the border parcels

const overrides = {
  SULLIVAN: {
    WASHINGTON: loadem('./proxy/assets/washington-boundary.geojson')
  }
};

const dist = './data';

const townsByCounty: Record<string, GeoJSON.Feature[]> = {};
const wholeState: GeoJSON.Feature[] = [];

towns.features.forEach((feature: GeoJSON.Feature) => {
  const county = String(
    feature.properties.PB_TOWN_Census_2010_StatsCOUNTYNAME
  ).toUpperCase();

  const town = (feature.properties.pbpNAME as string).toUpperCase();

  console.log(
    chalk.green(`... writing ${theState}/${county}/${town}/boundary.geojson`)
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

  // 👇 one directory, one file per town
  //    use the hand-tweaked version here if we have one
  //    DON'T use it elsewhere so that the town boundaries can jigsaw together
  //    as the original State data intended them to

  mkdirSync(`${dist}/${theState}/${county}/${town}`, { recursive: true });
  writeFileSync(
    `${dist}/${theState}/${county}/${town}/boundary.geojson`,
    JSON.stringify(overrides[county]?.[town] ?? simplify(geojson))
  );
});

// 👉 one file for each county
Object.keys(townsByCounty).forEach((county) => {
  console.log(chalk.green(`... writing ${theState}/${county}/towns.geojson`));
  const geojson: GeoJSON.FeatureCollection = {
    features: townsByCounty[county],
    type: 'FeatureCollection'
  };
  writeFileSync(
    `${dist}/${theState}/${county}/towns.geojson`,
    JSON.stringify(simplify(geojson))
  );
});

// 👉 one file for all towns
console.log(chalk.green(`... writing ${theState}/towns.geojson`));
const geojson: GeoJSON.FeatureCollection = {
  features: wholeState,
  type: 'FeatureCollection'
};
writeFileSync(
  `${dist}/${theState}/towns.geojson`,
  JSON.stringify(simplify(geojson))
);
