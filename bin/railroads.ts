import { simplify } from '../lib/src/common';
import { theState } from '../lib/src/common';

import * as turf from '@turf/turf';

import { mkdirSync } from 'fs';
import { readFileSync } from 'fs';
import { writeFileSync } from 'fs';

import chalk from 'chalk';

// 👉 file on server uses eastings, northings and has no properties
//    so we grabbed a file that works and we assume it won't change
// url: 'https://ftp.granit.sr.unh.edu/GRANIT_Data/Vector_Data/Transportation_Networks/d-railroads/rr'
const railroads = JSON.parse(
  readFileSync('./bin/assets/New_Hampshire_Railroads.geojson').toString()
);

const dist = './data';

console.log(chalk.green(`... writing /${theState}/railroads.geojson`));

railroads.features.forEach((feature: GeoJSON.Feature) => {
  // 👉 some features have bbox on the geometry, we created our own
  delete feature.geometry.bbox;

  // 👉 every feature must have an ID
  //    we aren't 1000% sure that RR_UID is unique
  feature.id = `${feature.properties.RRI_UID}-${feature.properties.RRI}`;

  feature.bbox = turf.bbox(feature);
  feature.properties = {
    name: feature.properties.NAME,
    status: feature.properties.STATUS
  };
});

// 👉 write out all-in-one file
mkdirSync(`${dist}/${theState}`, { recursive: true });
writeFileSync(
  `${dist}/${theState}/railroads.geojson`,
  JSON.stringify(simplify(railroads))
);

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/naming-convention */

const sample = {
  OBJECTID: 1,
  NAME: 'Spur Boston and Maine Corp - 2a',
  SECT_LENGTH: 0.29725199,
  NAME_HISTORIC: null,
  STATUS: 'Abandoned',
  PURCHASE: null,
  ABANDONMENT_YEAR: null,
  OPERATOR: 'BM',
  CREATE_USER: null,
  CREATE_DATE: null,
  UPDT_USER: 'N46EP',
  UPDT_DATE: '2013-12-16T08:27:59Z',
  OWNERSHIP: 'BM',
  SHAPE_Length: 1569.4905317078653,
  RRI_UID: 102,
  RRI: 'SP003_01',
  MP_START: 0,
  MP_END: 0.29725199,
  NEEDS_CALIBRATION: null,
  PARTS: null,
  IS_PASSENGER: null
};
