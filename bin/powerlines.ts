import { simplify } from '../lib/src/common.ts';
import { theState } from '../lib/src/common.ts';

import { bbox } from '@turf/bbox';
import { booleanIntersects } from '@turf/boolean-intersects';
import { featureCollection } from '@turf/helpers';
import { mkdirSync } from 'node:fs';
import { readFileSync } from 'node:fs';
import { writeFileSync } from 'node:fs';

import chalk from 'chalk';
import copy from 'fast-copy';

// 🔥 you need to run powerlines-prepare.ts at least once first

const dist = './data';

const powerlines = JSON.parse(
  readFileSync(
    './bin/assets/New_Hampshire_Electric_Power_Transmission_Lines.geojson'
  ).toString()
);

const allTowns = JSON.parse(
  readFileSync(`${dist}/${theState}/towns.geojson`).toString()
);

const index = JSON.parse(readFileSync(`${dist}/index.json`).toString());

const linesByCountyByTown = {};

function lookupCounty(town: string): string {
  const counties = Object.keys(index[theState]);
  const county = counties.filter((county) => index[theState][county][town]);
  return county?.[0];
}

powerlines.features.forEach((feature: GeoJSON.Feature) => {
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
        const powerline = copy(feature);

        // 👉 some features have bbox on the geometry, we created our own
        delete powerline.geometry.bbox;

        // 👉 every feature must have an ID
        powerline.id = powerline.properties.ID;

        powerline.bbox = bbox(powerline);
        powerline.properties = {
          county: county,
          town: town
        };

        linesByCountyByTown[county] ??= {};
        const geojson = featureCollection([]);
        linesByCountyByTown[county][town] ??= geojson;
        linesByCountyByTown[county][town].features.push(powerline);
      }
    });
});

// 👉 one file per town
Object.keys(linesByCountyByTown).forEach((county) => {
  Object.keys(linesByCountyByTown[county]).forEach((town) => {
    console.log(
      chalk.green(
        `... writing ${theState}/${county}/${town}/powerlines.geojson`
      )
    );
    mkdirSync(`${dist}/${theState}/${county}/${town}`, { recursive: true });
    writeFileSync(
      `${dist}/${theState}/${county}/${town}/powerlines.geojson`,
      JSON.stringify(simplify(linesByCountyByTown[county][town]))
    );
  });
});

const _sample = {
  OBJECTID: 1,
  ID: '212144',
  TYPE: 'AC; OVERHEAD',
  STATUS: 'IN SERVICE',
  NAICS_CODE: '221121',
  NAICS_DESC: 'ELECTRIC BULK POWER TRANSMISSION AND CONTROL',
  SOURCE: 'IMAGERY',
  SOURCEDATE: '2020-03-04T00:00:00Z',
  VAL_METHOD: 'IMAGERY',
  VAL_DATE: '2020-03-04T00:00:00Z',
  OWNER: 'BONNEVILLE POWER ADMINISTRATION',
  VOLTAGE: 69,
  VOLT_CLASS: 'UNDER 100',
  INFERRED: 'Y',
  SUB_1: 'EAST ARLINGTON',
  SUB_2: 'TAP209798',
  SHAPE_Length: 0.09014889071718463
};
