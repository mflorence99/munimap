import { copyFileSync } from 'fs';

import chalk from 'chalk';

const dist = './dist/proxy';

const state = 'NEW HAMPSHIRE';

console.log(chalk.green(`... writing ${state}/boundary.geojson`));

copyFileSync(
  './proxy/assets/New_Hampshite_State_Boundary.geojson',
  `${dist}/${state}/boundary.geojson`
);
