import * as inquirer from 'inquirer';

import { XMLBuilder } from 'fast-xml-parser';
import { XMLParser } from 'fast-xml-parser';

import { readFileSync } from 'fs';
import { writeFileSync } from 'fs';

import chalk from 'chalk';

type LonLat = { lat: number; lon: number };

// 🔥 all this assumes that the culverts are measured sequentially !!

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
  const options = {
    format: true,
    ignoreAttributes: false
  };
  const gpx = new XMLParser(options).parse(raw);

  // 🔥 if not enough coordinates, bail
  const numCulverts = gpx.gpx.wpt.length;
  const withCoordinates = gpx.gpx.wpt.filter(
    (culvert) => !nocoords(lonlat(culvert))
  );
  const numCoordinates = withCoordinates.length;
  if (numCoordinates < 3 || numCoordinates / numCulverts < 0.75) {
    console.log(chalk.red('🔥 Too many missing coordinates found in GPX!'));
    return;
  }

  // 👇 what's the average gap between coordinates?
  const averageGap = withCoordinates
    // 👉 first get all the gaps
    .reduce((acc, culvert, ix, array) => {
      if (ix < array.length - 1) {
        const curr = lonlat(culvert);
        const next = lonlat(array[ix + 1]);
        acc.push({ lon: next.lon - curr.lon, lat: next.lat - curr.lat });
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

    // 👇 if no coordinate, extrapolate from the prev or next
    if (nocoords(curr)) {
      // 🔥 TEMPORARY
      const prev = ix > 0 ? lonlat(array[ix - 1]) : null;
      const next = ix < array.length - 1 ? lonlat(array[ix + 1]) : null;
      if (prev) {
        curr.lon = prev.lon + averageGap.lon;
        curr.lat = prev.lat + averageGap.lat;
      } else if (next) {
        curr.lon = prev.lon - averageGap.lon;
        curr.lat = prev.lat - averageGap.lat;
      }
      culvert['@_lon'] = curr.lon;
      culvert['@_lat'] = curr.lat;
    }

    // 👇 description can't be undefined
    if (culvert.desc === 'undefined') delete culvert.desc;

    // 👇 we don't use type or time at all
    delete culvert.time;
    delete culvert.type;

    // 👇 note progress
    console.log(
      chalk.whiteBright(`#${ix + 1}`),
      chalk.yellow(`[${curr.lon}, ${curr.lat}]`),
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
  writeFileSync(output.path, new XMLBuilder(options).build(gpx));
}

function lonlat(culvert): LonLat {
  return { lon: Number(culvert['@_lon']), lat: Number(culvert['@_lat']) };
}

function nocoords(coord: LonLat): boolean {
  return coord.lon === 0 || coord.lat === 0;
}

main();
