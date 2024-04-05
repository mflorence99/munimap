import { HistoricalMapIndex } from '../lib/src/common';

import { theState } from '../lib/src/common';

import { PutObjectCommand } from '@aws-sdk/client-s3';
import { S3Client } from '@aws-sdk/client-s3';

import { readFileSync } from 'fs';
import { writeFileSync } from 'fs';

import chalk from 'chalk';

type HistoricalSource = {
  dir: string;
  feathered?: boolean;
  featherFilter?: string;
  featherWidth?: [number, 'feet' | 'miles'];
  filter?: string;
  masked: boolean;
  name: string;
};

const bucket = 'munimap-historical-images';

const curated: Record<string, Record<string, HistoricalSource[]>> = {
  SULLIVAN: {
    WASHINGTON: [
      {
        dir: './bin/assets/washington-1860',
        feathered: true,
        featherFilter: 'opacity(25%) grayscale()',
        featherWidth: [1200, 'feet'],
        filter: 'sepia(20%)',
        masked: true,
        name: '1860 HF Walling'
      },
      {
        dir: './bin/assets/washington-1892',
        feathered: true,
        featherFilter: 'opacity(50%) grayscale()',
        featherWidth: [1000, 'feet'],
        masked: true,
        name: '1892 DH Hurd'
      },
      {
        dir: './bin/assets/washington-hwy-1930',
        masked: true,
        name: '1930 Hwy Dept'
      },
      {
        dir: './bin/assets/washington-usgs-1930',
        masked: true,
        name: '1930 USGS'
      },
      {
        dir: './bin/assets/washington-usgs-1942',
        masked: true,
        name: '1942 USGS'
      },
      {
        dir: './bin/assets/washington-usgs-1957',
        masked: true,
        name: '1957 USGS'
      },
      {
        dir: './bin/assets/washington-usgs-1984',
        masked: true,
        name: '1984 USGS'
      }
    ]
  }
};

const client = new S3Client({});

const dist = './lib/assets';

const historicalMaps: HistoricalMapIndex = {};

async function main(): Promise<void> {
  // 👇 for each curated county, town

  for (const county of Object.keys(curated)) {
    for (const town of Object.keys(curated[county])) {
      // 👇 for each historical map ...
      curated[county][town].forEach(async (source) => {
        // 👇 this allows us to use a flat naming scheme
        const path = `${theState}:${county}:${town}`;
        const target = `${path.replaceAll(':', '-')}-${source.name}.jpeg`;

        // 👇 start the copy process
        console.log(chalk.green(`... writing ${source.name} to ${target}`));

        // 👇 add this historical to the manifest of all historicals
        const metadata = JSON.parse(
          readFileSync(`${source.dir}/metadata.json`).toString()
        );
        historicalMaps[path] ??= [];
        const layer = metadata.layers.find(
          (layer) => layer.type === 'GeoImage'
        );
        historicalMaps[path].push({
          center: layer.imageCenter,
          feathered: source.feathered,
          featherFilter: source.featherFilter,
          featherWidth: source.featherWidth,
          filter: source.filter,
          masked: source.masked,
          name: source.name,
          rotate: layer.imageRotate,
          scale: layer.imageScale,
          url: `https://munimap-historical-images.s3.us-east-1.amazonaws.com/${target}`
        });

        // 👇 upload the map to S3
        const buffer = readFileSync(`${source.dir}/map.jpeg`);
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
    JSON.stringify(historicalMaps, null, 2)
  );
}

main();
