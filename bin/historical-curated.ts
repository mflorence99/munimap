import { HistoricalMapIndex } from '../lib/src/common';

import { theState } from '../lib/src/common';

import { copyFileSync } from 'fs';
import { mkdirSync } from 'fs';
import { readFileSync } from 'fs';
import { writeFileSync } from 'fs';

import chalk from 'chalk';
import hash from 'object-hash';

const curated = {
  SULLIVAN: {
    WASHINGTON: [
      { dir: './bin/assets/washington-usgs-1930', name: '1930 USGS' },
      { dir: './bin/assets/washington-usgs-1942', name: '1942 USGS' }
    ]
  }
};

const dist = './data';

const historicals: HistoricalMapIndex = {};

// 👇 for each curated county, town

Object.keys(curated).forEach((county) => {
  Object.keys(curated[county]).forEach((town) => {
    // 👇 for each historical map ...
    curated[county][town].forEach((historical) => {
      // 👇 this allows us to use a flat directory structure
      const path = `${theState}:${county}:${town}`;
      const hashed = hash.MD5(path);

      // 👇 start the copy process
      console.log(chalk.green(`... writing ${historical.name} to ${path}`));
      mkdirSync(`${dist}/${hashed}`, { recursive: true });

      // 👇 add this historical to the manifest of all historicals
      const metadata = JSON.parse(
        readFileSync(`${historical.dir}/metadata.json`).toString()
      );
      historicals[path] ??= [];
      const layer = metadata.layers.find((layer) => layer.type === 'GeoImage');
      historicals[path].push({
        description: historical.name,
        imageCenter: layer.imageCenter,
        imageRotate: layer.imageRotate,
        imageScale: layer.imageScale,
        url: `${hashed}/${historical.name}.jpeg`
      });

      // 👇 copy the map into a flat directory structure under an unique
      //    but repeatable name
      copyFileSync(
        `${historical.dir}/map.jpeg`,
        `${dist}/${hashed}/${historical.name}.jpeg`
      );
    });
  });
});

// 👇 finally write out the manifest

console.log(chalk.green(`... writing ${dist}/historicals.json`));
writeFileSync(`${dist}/historicals.json`, JSON.stringify(historicals));
