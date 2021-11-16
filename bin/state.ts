import { copyFileSync } from 'fs';
import { theState } from '@lib/geojson';

import chalk from 'chalk';

const dist = './dist/proxy';

console.log(chalk.green(`... writing ${theState}/boundary.geojson`));

copyFileSync(
  './proxy/assets/New_Hampshite_State_Boundary.geojson',
  `${dist}/${theState}/boundary.geojson`
);
