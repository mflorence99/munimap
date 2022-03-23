/* eslint-disable @typescript-eslint/naming-convention */

import { Features } from '../lib/src/geojson';

import { simplify } from '../lib/src/geojson';
import { theState } from '../lib/src/geojson';

import { mkdirSync } from 'fs';
import { readFileSync } from 'fs';
import { writeFileSync } from 'fs';

import chalk from 'chalk';

const loadem = (fn): Features => JSON.parse(readFileSync(fn).toString());

// 👇 some towns have curated buildings

const curated = {
  SULLIVAN: {
    WASHINGTON: loadem('./proxy/assets/washington-buildings.geojson')
  }
};

const dist = './data';

// 👇 for each curated county, town

Object.keys(curated).forEach((county) => {
  Object.keys(curated[county]).forEach((town) => {
    const geojson = curated[county][town];

    console.log(
      chalk.green(`... writing ${theState}/${county}/${town}/buildings.geojson`)
    );
    mkdirSync(`${dist}/${theState}/${county}/${town}`, { recursive: true });
    writeFileSync(
      `${dist}/${theState}/${county}/${town}/buildings.geojson`,
      JSON.stringify(simplify(geojson))
    );
  });
});
