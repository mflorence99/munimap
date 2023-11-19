import { simplify } from '../lib/src/common';
import { theState } from '../lib/src/common';

import * as turf from '@turf/turf';

import { mkdirSync } from 'fs';
import { readFileSync } from 'fs';
import { writeFileSync } from 'fs';

import booleanIntersects from '@turf/boolean-intersects';
import chalk from 'chalk';
import copy from 'fast-copy';
import hash from 'object-hash';
import shp from 'shpjs';

const url =
  'https://ftp.granit.sr.unh.edu/GRANIT_Data/Vector_Data/Transportation_Networks/d-trails/nhtrails';

const dist = './data';

const allTowns = JSON.parse(
  readFileSync(`${dist}/${theState}/towns.geojson`).toString()
);

const index = JSON.parse(readFileSync(`${dist}/index.json`).toString());

const trailsByCountyByTown = {};

function lookupCounty(town: string): string {
  const counties = Object.keys(index[theState]);
  const county = counties.filter((county) => index[theState][county][town]);
  return county?.[0];
}

// 👇 keep track of progress
const gulp = 1000;
let lastIndex = 0;
let lastTime = Date.now();

async function main(): Promise<void> {
  console.log(chalk.blue(`Loading ${url}...`));
  const trails = (await shp(url)) as GeoJSON.FeatureCollection;

  // 👇 let's get started
  const numTrails = trails.features.length;
  trails.features.forEach((feature: GeoJSON.Feature, ix: number) => {
    // 👇 this takes forever, so let's try to log progress
    const index = Math.trunc(ix / gulp) * gulp;
    if (index !== lastIndex) {
      const timeNow = Date.now();
      const duration = timeNow - lastTime;
      console.log(
        chalk.yellow(
          `... ${ix} of ${numTrails} in ${duration / 1000} secs`,
          chalk.cyan(
            `ETA ${
              (((numTrails - ix) / gulp) * duration) / (1000 * 60 * 60)
            } hours`
          )
        )
      );
      lastIndex = index;
      lastTime = timeNow;
    }

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
          const trail = copy(feature);

          // 👉 some features have bbox on the geometry, we created our own
          delete trail.geometry.bbox;

          // 👉 The original dataset doesn't give a reliable unique ID
          //    so let's at least use a hash of the geometry so that
          //    every time we load the same ID is used
          trail.id = hash.MD5(trail.geometry as any);

          trail.bbox = turf.bbox(trail);
          trail.properties = {
            county: county,
            name: trail.properties.TRAILNAME,
            system: trail.properties.TRAILSYS,
            town: town
          };

          trailsByCountyByTown[county] ??= {};
          const geojson = turf.featureCollection([]);
          trailsByCountyByTown[county][town] ??= geojson;
          trailsByCountyByTown[county][town].features.push(trail);
        }
      });
  });

  // 👉 one file per town
  Object.keys(trailsByCountyByTown).forEach((county) => {
    Object.keys(trailsByCountyByTown[county]).forEach((town) => {
      console.log(
        chalk.green(`... writing ${theState}/${county}/${town}/trails.geojson`)
      );
      mkdirSync(`${dist}/${theState}/${county}/${town}`, { recursive: true });
      writeFileSync(
        `${dist}/${theState}/${county}/${town}/trails.geojson`,
        JSON.stringify(simplify(trailsByCountyByTown[county][town]))
      );
    });
  });
}

main();

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/naming-convention */

const sample = {
  OBJECTID: 1,
  TRAIL: 'Y',
  TRAILNAME: '48T',
  TRAILSYS: 'Drummer Hill and Goose Pond',
  COMMUNITY: 'Keene',
  MILES: 0.454302189672,
  BLAZE: '',
  MAINTORG: 0,
  NOTES: '',
  PED: '1',
  MTNBIKE: '1',
  ROADBIKE: '',
  XCSKI: '1',
  SNOWMBL: '',
  ATV: '',
  DIRTBIKE: '',
  HORSE: '',
  PADDLE: '',
  PAVED: '',
  GROOMED: '',
  ADA: '',
  WIDE: '',
  SEP_PATH: '',
  ALPINESKI: '',
  ACCURACY: 1,
  MAPURL:
    'https://www.trailfinder.info/trails/trail/drummer-hill-and-goose-pond',
  SHAPE_Leng: 2398.71556147
};
