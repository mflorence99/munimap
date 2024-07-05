import { simplify } from "../lib/src/common";
import { theState } from "../lib/src/common";

import { mkdirSync } from "fs";
import { readFileSync } from "fs";
import { writeFileSync } from "fs";

import chalk from "chalk";

const dist = "./data";

const boundary = JSON.parse(
  readFileSync("./bin/assets/New_Hampshite_State_Boundary.geojson").toString(),
);

console.log(chalk.green(`... writing ${theState}/boundary.geojson`));

mkdirSync(`${dist}/${theState}`, { recursive: true });
writeFileSync(
  `${dist}/${theState}/boundary.geojson`,
  JSON.stringify(simplify(boundary)),
);
