import { simplify } from '../lib/src/common.ts';
import { theState } from '../lib/src/common.ts';

import { mkdirSync } from 'node:fs';
import { readFileSync } from 'node:fs';
import { writeFileSync } from 'node:fs';

import chalk from 'chalk';

const dist = './data';

const boundary = JSON.parse(
  readFileSync('./bin/assets/New_Hampshite_State_Boundary.geojson').toString()
);

console.log(chalk.green(`... writing ${theState}/boundary.geojson`));

mkdirSync(`${dist}/${theState}`, { recursive: true });
writeFileSync(
  `${dist}/${theState}/boundary.geojson`,
  JSON.stringify(simplify(boundary))
);
