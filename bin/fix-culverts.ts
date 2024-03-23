import * as inquirer from 'inquirer';

import { XMLBuilder } from 'fast-xml-parser';
import { XMLParser } from 'fast-xml-parser';

import { exit } from 'process';
import { readFileSync } from 'fs';
import { writeFileSync } from 'fs';

import chalk from 'chalk';
// import jsome from 'jsome';

type Culvert = {
  $$lat: string;
  $$lon: string;
  desc: string;
  ele: number;
  name: string;
  time: string;
  type: string;
};

type GPX = {
  gpx: {
    wpt: Culvert[];
  };
};

type LonLat = { lat: number; lon: number };

const XMLOptions = {
  attributeNamePrefix: '$$',
  format: true,
  ignoreAttributes: false
};

// ////////////////////////////////////////////////////////////////////////////
// 👇 MAIN
//
// 🔥 all this assumes that the culverts are measured sequentially !!
// ////////////////////////////////////////////////////////////////////////////

async function main(): Promise<void> {
  // 👇 which GPX?
  const input = await inquirer.prompt({
    message: 'Enter path to culverts GPX:',
    name: 'path',
    type: 'input'
  });

  // 👇 read and parse the GPX
  console.log(chalk.green(`👈 Reading ${input.path}`));
  const raw = readFileSync(input.path).toString();
  const gpx: GPX = new XMLParser(XMLOptions).parse(raw);

  // 🔥 if not enough coordinates, bail
  const numCulverts = gpx.gpx.wpt.length;
  const withCoordinates = gpx.gpx.wpt.filter((culvert) =>
    isCoord(lonlat(culvert))
  );
  const numCoordinates = withCoordinates.length;
  if (numCoordinates < 3 || numCoordinates / numCulverts < 0.75) {
    console.log(chalk.red('🔥 Too many missing coordinates found in GPX!'));
    exit(-1);
  }

  // 👇 what direction are we following?
  // 🔥 a very rough algorithm!
  const coords = withCoordinates.map((culvert) => lonlat(culvert));
  const londir = coords.at(0).lon > coords.at(-1).lon ? -1 : +1;
  const latdir = coords.at(0).lat > coords.at(-1).lat ? -1 : +1;

  // 👇 what's the average gap between coordinates?
  const averageGap = withCoordinates
    // 👉 first get all the gaps
    .reduce((acc, culvert, ix, array) => {
      if (ix < array.length - 1) {
        const curr = lonlat(culvert);
        const next = lonlat(array.at(ix + 1));
        acc.push({
          lon: Math.abs(next.lon - curr.lon),
          lat: Math.abs(next.lat - curr.lat)
        });
      }
      return acc;
    }, [])
    // 👉 finally average the gaps
    .reduce(
      (acc, gap, ix, array) => {
        acc.lon += gap.lon;
        acc.lat += gap.lat;
        return ix === array.length - 1
          ? { lon: acc.lon / array.length, lat: acc.lat / array.length }
          : acc;
      },
      { lon: 0, lat: 0 }
    );

  // 👇 for each culvert ...
  gpx.gpx.wpt.forEach((culvert, ix, array) => {
    const curr = lonlat(culvert);
    let extrapolated = false;

    // 👇 description can't be undefined
    if (culvert.desc === 'undefined') delete culvert.desc;

    // 👇 we don't use type or time at all
    delete culvert.time;
    delete culvert.type;

    // 👇 if no coordinate, extrapolate from the prev
    if (!isCoord(curr)) {
      const [prev, count] = findCoord(array, ix, -1);
      if (prev) {
        curr.lon = prev.lon + (averageGap.lon / count) * londir;
        curr.lat = prev.lat + (averageGap.lat / count) * latdir;
        extrapolated = true;
      }
    }

    // 👇 if still no coordinate, extrapolate from the next
    if (!isCoord(curr)) {
      const [next, count] = findCoord(array, ix, +1);
      if (next) {
        curr.lon = next.lon - (averageGap.lon / count) * londir;
        curr.lat = next.lat - (averageGap.lat / count) * latdir;
        extrapolated = true;
      }
    }

    // 👇 BINGO!
    if (isCoord(curr)) {
      culvert.$$lon = String(curr.lon);
      culvert.$$lat = String(curr.lat);
      if (extrapolated) {
        const flag = 'LOCATION EXTRAPOLATED';
        if (culvert.desc) culvert.desc = `${culvert.desc} (${flag})`;
        else culvert.desc = flag;
      }
    } else {
      console.log(
        chalk.red('🔥 SHOULD NOT OCCUR - unable to extrapolate coordinate!')
      );
      exit(-1);
    }

    // 👇 note progress
    console.log(
      chalk.whiteBright(`#${ix + 1}`),
      (extrapolated ? chalk.redBright : chalk.yellow)(
        `[${curr.lon}, ${curr.lat}]`
      ),
      chalk.cyan(`${culvert.name}`),
      chalk.magenta(`${culvert.desc ?? ''}`)
    );
  });

  // 👇 where to write?
  const output = await inquirer.prompt({
    message: 'Enter path to culverts GPX:',
    name: 'path',
    type: 'input'
  });

  // 👇 reconstitute the GPX and save it
  console.log(chalk.green(`👉 Writing ${output.path}`));
  writeFileSync(output.path, new XMLBuilder(XMLOptions).build(gpx));
}

// ////////////////////////////////////////////////////////////////////////////
// 👇 HELPERS
// ////////////////////////////////////////////////////////////////////////////

function findCoord(
  culverts: Culvert[],
  ix: number,
  step: number
): [LonLat, number] {
  let count, coord;
  for (count = 1; ix > 0 && ix < culverts.length - 1; count++) {
    ix += step;
    coord = lonlat(culverts.at(ix));
    if (isCoord(coord)) break;
  }
  return [coord, count];
}

function isCoord(coord: LonLat): boolean {
  return coord.lon !== 0 && coord.lat !== 0;
}

function lonlat(culvert: Culvert): LonLat {
  return { lon: Number(culvert.$$lon), lat: Number(culvert.$$lat) };
}

main();
