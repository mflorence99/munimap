import { HistoricalMapIndex } from '../lib/src/common';

import { theState } from '../lib/src/common';

import { PutObjectCommand } from '@aws-sdk/client-s3';
import { S3Client } from '@aws-sdk/client-s3';

import { readFileSync } from 'fs';
import { writeFileSync } from 'fs';
import { env } from 'process';

import chalk from 'chalk';
import JSZip from 'jszip';

// 🔥 lots of assumptions here:
//     1. map image in directory is named map.jpeg
//     2. metadata for image is produced by Map-georeferencer
//        and is named metadata.json
//     3. tiles named tiles.zip and producerd by QGis / QTiles
//     4. tileset name is tiles
//     5. output format is jpg

type HistoricalSource = {
  dir: string;
  feathered?: boolean;
  featherFilter?: string;
  featherWidth?: [number, 'feet' | 'miles'];
  filter?: string;
  masked: boolean;
  maxZoom?: number;
  minZoom?: number;
  name: string;
  tiled?: boolean;
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
        name: '1892 DH Hurd',
        tiled: true
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

const s3Domain = `s3.${env.AWS_BUCKET}.amazonaws.com`;

async function main(): Promise<void> {
  // 👇 for each curated county, town

  for (const county of Object.keys(curated)) {
    for (const town of Object.keys(curated[county])) {
      // 👇 for each historical map ...
      curated[county][town].forEach(async (source) => {
        // 👇 this allows us to use a flat naming scheme
        const path = `${theState}:${county}:${town}`;

        // 👇 start the copy process
        console.log(chalk.green(`... writing ${source.name} to ${path}`));

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
          maxZoom: source.maxZoom,
          minZoom: source.minZoom,
          name: source.name,
          rotate: layer.imageRotate,
          scale: layer.imageScale,
          tiled: source.tiled,
          url: source.tiled
            ? `https://${bucket}.${s3Domain}/${path}/${source.name}/tiles/{z}/{x}/{y}.jpg`
            : `https://${bucket}.${s3Domain}/${path}/${source.name}.jpeg`
        });

        // 👇 upload the map tiles to S3
        if (source.tiled) {
          const zip = await JSZip.loadAsync(
            readFileSync(`${source.dir}/tiles.zip`)
          );
          const entries = zip.filter((path, file) => !file.dir);
          for (let i = 0; i < 5; i++) {
            const entry = entries[i];
            console.log(chalk.red(`... unzipping ${entry.name}`));
            const buffer = await entry.async('nodebuffer');
            await client.send(
              new PutObjectCommand({
                Bucket: bucket,
                Key: `${path}/${source.name}/${entry.name}`,
                Body: buffer,
                ContentType: 'image/jpeg'
              })
            );
          }
        }

        // 👇 upload the untiled map image to S3
        else {
          const buffer = readFileSync(`${source.dir}/map.jpeg`);
          await client.send(
            new PutObjectCommand({
              Bucket: bucket,
              Key: `${path}/${source.name}.jpeg`,
              Body: buffer,
              ContentType: 'image/jpeg'
            })
          );
        }
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
