/* eslint-disable @typescript-eslint/naming-convention */
import { simplify } from '../lib/src/geojson';
import { theState } from '../lib/src/geojson';

import * as turf from '@turf/turf';

import { mkdirSync } from 'fs';
import { readFileSync } from 'fs';
import { writeFileSync } from 'fs';

import booleanIntersects from '@turf/boolean-intersects';
import chalk from 'chalk';
import copy from 'fast-copy';
import shp from 'shpjs';

const url =
  'https://ftp.granit.sr.unh.edu/GRANIT_Data/Vector_Data/Inland_Water_Resources/d-designatedrivers/Designated_Rivers_24k';

const dist = './dist/proxy';

const allTowns = JSON.parse(
  readFileSync(`${dist}/${theState}/towns.geojson`).toString()
);

const index = JSON.parse(readFileSync(`${dist}/index.json`).toString());

const riversByCountyByTown = {};

function lookupCounty(town: string): string {
  const counties = Object.keys(index[theState]);
  const county = counties.filter((county) => index[theState][county][town]);
  return county?.[0];
}

async function main(): Promise<void> {
  console.log(chalk.blue(`Loading ${url}...`));
  const rivers = (await shp(url)) as GeoJSON.FeatureCollection;

  rivers.features.forEach((feature: GeoJSON.Feature) => {
    // 👇 the data doesn't have the town, so lets see if turf can
    //    find it from the dataset of all towns
    const towns = allTowns.features.filter((townFeature) =>
      // 👉 https://github.com/Turfjs/turf/pull/2157
      /* turf. */ booleanIntersects(feature, townFeature)
    );

    towns
      .map((town) => town.id)
      .forEach((town) => {
        const county = lookupCounty(town);
        if (county) {
          const river = copy(feature);

          // 👉 some features have bbox on the geometry, we created our own
          delete river.geometry.bbox;

          // 👉 every feature must have an ID
          //    we aren't 1000% sure that GRANITID is unique
          river.id = `${river.properties.GRANITID}-${river.properties.DR24K_ID}`;

          river.bbox = turf.bbox(river);
          river.properties = {
            county: county,
            name: river.properties.River_Name ?? river.properties.LAC,
            section: river.properties.River_Sect,
            town: town
          };

          riversByCountyByTown[county] ??= {};
          const geojson: GeoJSON.FeatureCollection = {
            features: [],
            type: 'FeatureCollection'
          };
          riversByCountyByTown[county][town] ??= geojson;
          riversByCountyByTown[county][town].features.push(river);
        }
      });
  });

  // 👉 one file per town
  Object.keys(riversByCountyByTown).forEach((county) => {
    Object.keys(riversByCountyByTown[county]).forEach((town) => {
      console.log(
        chalk.green(`... writing ${theState}/${county}/${town}/rivers.geojson`)
      );
      mkdirSync(`${dist}/${theState}/${county}/${town}`, { recursive: true });
      writeFileSync(
        `${dist}/${theState}/${county}/${town}/rivers.geojson`,
        JSON.stringify(simplify(riversByCountyByTown[county][town]))
      );
    });
  });
}

main();

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const sample = {
  LENGTH: 179.100757838,
  DR24K_: 569,
  DR24K_ID: 1858,
  GRANITID: 14501858,
  HYA: 6,
  ACODE: 22,
  Class: 'Rural',
  LENGTH_MI: 0.0339205980753,
  SWQPAExmpt: '',
  River_Sect: 'Ashuelot River',
  River_Name: 'Ashuelot River',
  LAC: 'Ashuelot River'
};
