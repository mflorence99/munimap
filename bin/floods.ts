/* eslint-disable @typescript-eslint/naming-convention */
import { theState } from '../lib/src/geojson';

import * as turf from '@turf/turf';

import { mkdirSync } from 'fs';
import { readFileSync } from 'fs';
import { writeFileSync } from 'fs';

import booleanIntersects from '@turf/boolean-intersects';
import chalk from 'chalk';
import copy from 'fast-copy';

const floods = JSON.parse(
  readFileSync('/home/mflo/Downloads/fema/S_FLD_HAZ_LN.geojson').toString()
);

const dist = './dist/proxy';

const allTowns = JSON.parse(
  readFileSync(`${dist}/${theState}/towns.geojson`).toString()
);

const stateBoundary = JSON.parse(
  readFileSync(`${dist}/${theState}/boundary.geojson`).toString()
);

const index = JSON.parse(readFileSync(`${dist}/index.json`).toString());

const floodsByCountyByTown = {};

function lookupCounty(town: string): string {
  const counties = Object.keys(index[theState]);
  const county = counties.filter((county) => index[theState][county][town]);
  return county?.[0];
}

// 👇 keep track of progress
const gulp = 100;
let lastIndex = 0;
let lastTime = Date.now();

function main(): void {
  const numFloods = floods.features.length;
  floods.features.forEach((feature: GeoJSON.Feature, ix: number) => {
    // 👇 this takes forever, so let's try to log progress
    const index = Math.trunc(ix / gulp) * gulp;
    if (index !== lastIndex) {
      const timeNow = Date.now();
      const duration = timeNow - lastTime;
      console.log(
        chalk.yellow(
          `... ${ix} of ${numFloods} in ${duration / 1000} secs`,
          chalk.cyan(
            `ETA ${
              (((numFloods - ix) / gulp) * duration) / (1000 * 60 * 60)
            } hours`
          )
        )
      );
      lastIndex = index;
      lastTime = timeNow;
    }

    // 👇 the data might not even be in-state

    if (/* turf. */ booleanIntersects(feature, stateBoundary.features[0])) {
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
            const flood = copy(feature);

            // 👉 some features have bbox on the geometry, we created our own
            delete flood.geometry.bbox;

            // 👉 every feature must have an ID
            flood.id = flood.properties.FLD_LN_ID;

            flood.bbox = turf.bbox(flood);
            flood.properties = {
              county: county,
              town: town
            };

            floodsByCountyByTown[county] ??= {};
            const geojson: GeoJSON.FeatureCollection = {
              features: [],
              type: 'FeatureCollection'
            };
            floodsByCountyByTown[county][town] ??= geojson;
            floodsByCountyByTown[county][town].features.push(flood);
          }
        });
    }
  });

  // 👉 one file per town
  Object.keys(floodsByCountyByTown).forEach((county) => {
    Object.keys(floodsByCountyByTown[county]).forEach((town) => {
      console.log(
        chalk.green(`... writing ${theState}/${county}/${town}/floods.geojson`)
      );
      mkdirSync(`${dist}/${theState}/${county}/${town}`, { recursive: true });
      writeFileSync(
        `${dist}/${theState}/${county}/${town}/floods.geojson`,
        JSON.stringify(floodsByCountyByTown[county][town], null, 2)
      );
    });
  });
}

main();

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const sample_AR = {
  DFIRM_ID: '33003C',
  VERSION_ID: '1.1.1.0',
  FLD_AR_ID: '33003C_732',
  STUDY_TYP: 'NP',
  FLD_ZONE: 'AE',
  ZONE_SUBTY: null,
  SFHA_TF: 'T',
  STATIC_BFE: -9999,
  V_DATUM: null,
  DEPTH: -9999,
  LEN_UNIT: null,
  VELOCITY: -9999,
  VEL_UNIT: null,
  AR_REVERT: null,
  AR_SUBTRV: null,
  BFE_REVERT: -9999,
  DEP_REVERT: -9999,
  DUAL_ZONE: null,
  SOURCE_CIT: '33003C_FIS1',
  GFID: '20130319',
  SHAPE_Length: 0.16024243330482996,
  SHAPE_Area: 0.00005436589839896291
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const sample_LN = {
  DFIRM_ID: '33007C',
  VERSION_ID: '1.1.1.0',
  FLD_LN_ID: '33007C_2575',
  LN_TYP: 'SFHA / Flood Zone Boundary',
  SOURCE_CIT: '33007C_NP',
  GFID: '20130220_fix2'
};
