import { simplify } from '../lib/src/geojson';
import { theState } from '../lib/src/geojson';

import { mkdirSync } from 'fs';
import { readFileSync } from 'fs';
import { writeFileSync } from 'fs';

import chalk from 'chalk';

// 👉 Washington is special as we have already curated the buildings

const dist = './data';

const county = 'SULLIVAN';
const town = 'WASHINGTON';

const geojson = JSON.parse(
  readFileSync('./proxy/assets/washington-buildings.geojson').toString()
);

console.log(chalk.green(`... writing ${theState}/buildings.geojson`));

console.log(
  chalk.green(`... writing ${theState}/${county}/${town}/buildings.geojson`)
);
mkdirSync(`${dist}/${theState}/${county}/${town}`, { recursive: true });
writeFileSync(
  `${dist}/${theState}/${county}/${town}/buildings.geojson`,
  JSON.stringify(simplify(geojson))
);
