import { theState } from '../lib/src/geojson';

import { copyFileSync } from 'fs';

import chalk from 'chalk';

const dist = './dist/proxy';

console.log(chalk.green(`... writing ${theState}/boundary.geojson`));

copyFileSync(
  './proxy/assets/New_Hampshite_State_Boundary.geojson',
  `${dist}/${theState}/boundary.geojson`
);
