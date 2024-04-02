import { HistoricalMapIndex } from '../lib/src/common';

import { theState } from '../lib/src/common';

import { PutObjectCommand } from '@aws-sdk/client-s3';
import { S3Client } from '@aws-sdk/client-s3';

import { readFileSync } from 'fs';
import { writeFileSync } from 'fs';

import chalk from 'chalk';

const bucket = 'munimap-historical-images';

const curated = {
  SULLIVAN: {
    WASHINGTON: [
      { dir: './bin/assets/washington-1860', name: '1860 HF Walling' },
      { dir: './bin/assets/washington-1892', name: '1892 DH Hurd' },
      { dir: './bin/assets/washington-hwy-1930', name: '1930 Hwy Dept' },
      { dir: './bin/assets/washington-usgs-1930', name: '1930 USGS' },
      { dir: './bin/assets/washington-usgs-1942', name: '1942 USGS' },
      { dir: './bin/assets/washington-usgs-1957', name: '1957 USGS' },
      { dir: './bin/assets/washington-usgs-1984', name: '1984 USGS' }
    ]
  }
};

const client = new S3Client({});

const dist = './data';

const historicals: HistoricalMapIndex = {};

async function main(): Promise<void> {
  // 👇 for each curated county, town

  for (const county of Object.keys(curated)) {
    for (const town of Object.keys(curated[county])) {
      // 👇 for each historical map ...
      curated[county][town].forEach(async (historical) => {
        // 👇 this allows us to use a flat naming scheme
        const path = `${theState}:${county}:${town}`;
        const target = `${path.replaceAll(':', '-')}-${historical.name}.jpeg`;

        // 👇 start the copy process
        console.log(chalk.green(`... writing ${historical.name} to ${target}`));

        // 👇 add this historical to the manifest of all historicals
        const metadata = JSON.parse(
          readFileSync(`${historical.dir}/metadata.json`).toString()
        );
        historicals[path] ??= [];
        const layer = metadata.layers.find(
          (layer) => layer.type === 'GeoImage'
        );
        historicals[path].push({
          description: historical.name,
          imageCenter: layer.imageCenter,
          imageRotate: layer.imageRotate,
          imageScale: layer.imageScale,
          url: `https://munimap-historical-images.s3.us-east-1.amazonaws.com/${target}`
        });

        // 👇 upload the map to S3
        const buffer = readFileSync(`${historical.dir}/map.jpeg`);
        await client.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: target,
            Body: buffer,
            ContentType: 'image/jpeg'
          })
        );
      });
    }
  }

  // 👇 finally write out the manifest

  console.log(chalk.green(`... writing ${dist}/historicals.json`));
  writeFileSync(
    `${dist}/historicals.json`,
    JSON.stringify(historicals, null, 2)
  );
}

main();
