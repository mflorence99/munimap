import { simplify } from '../lib/src/common.ts';
import { theState } from '../lib/src/common.ts';

import { bbox } from '@turf/bbox';
import { featureCollection } from '@turf/helpers';
import { mkdirSync } from 'node:fs';
import { readFileSync } from 'node:fs';
import { writeFileSync } from 'node:fs';

import chalk from 'chalk';
import copy from 'fast-copy';
import hash from 'object-hash';
import shp from 'shpjs';

const dist = './data';

const index = JSON.parse(readFileSync(`${dist}/index.json`).toString());

const url =
  'https://ftp.granit.sr.unh.edu/GRANIT_Data/Vector_Data/Elevation_and_Derived_Products/d-bathymetry/Bathymetry_Lakes_polygons';

const lakesByCountyByTown = {};

function lookupCounty(town: string): string {
  const counties = Object.keys(index[theState]);
  const county = counties.filter((county) => index[theState][county][town]);
  return county?.[0];
}

async function main(): Promise<void> {
  console.log(chalk.blue(`Loading ${url}...`));
  const lakes = (await shp(url)) as GeoJSON.FeatureCollection;

  lakes.features.forEach((feature: GeoJSON.Feature) => {
    // 👉 we will ignore the county, as there will be multiple towns
    const townList = (feature.properties.TOWN as string)?.toUpperCase();

    if (townList) {
      const towns = townList.split('/');
      towns.forEach((town) => {
        const county = lookupCounty(town);
        if (county) {
          const lake = copy(feature);

          // 👉 some features have bbox on the geometry, we created our own
          delete lake.geometry.bbox;

          // 👉 AU_ID in the original dataset isn't unique
          //    so let's at least use a hash of the geometry so that
          //    every time we load the same ID is used
          lake.id = hash.MD5(lake.geometry as any);

          lake.bbox = bbox(lake);
          lake.properties = {
            county: county,
            name: lake.properties.LAKE,
            town: town
          };

          lakesByCountyByTown[county] ??= {};
          const geojson = featureCollection([]);
          lakesByCountyByTown[county][town] ??= geojson;
          lakesByCountyByTown[county][town].features.push(lake);
        }
      });
    }
  });

  // 👉 one file per town
  Object.keys(lakesByCountyByTown).forEach((county) => {
    Object.keys(lakesByCountyByTown[county]).forEach((town) => {
      console.log(
        chalk.green(`... writing ${theState}/${county}/${town}/lakes.geojson`)
      );
      mkdirSync(`${dist}/${theState}/${county}/${town}`, { recursive: true });
      writeFileSync(
        `${dist}/${theState}/${county}/${town}/lakes.geojson`,
        JSON.stringify(simplify(lakesByCountyByTown[county][town]))
      );
    });
  });
}

main();

const _sample = {
  AU_ID: 'NHLAK700061102-02',
  TOWN: 'SALEM/WINDHAM',
  AREA: 23385.9046882,
  ACRES: 0.537,
  SQKM: 0.0022,
  SQMETERS: 2172.6303,
  PERIMETER: 699.61609,
  DEPTHMIN: 0,
  DEPTHMAX: 0,
  COUNTY: 'ROCKINGHAM',
  LAKE: 'CANOBIE LAKE',
  SOURCE: 'NHDES'
};
