import { HistoricalMap } from '../lib/src/common';
import { HistoricalMapIndex } from '../lib/src/common';

import { theState } from '../lib/src/common';

import { PutObjectCommand } from '@aws-sdk/client-s3';
import { S3Client } from '@aws-sdk/client-s3';

import { env } from 'process';
import { readFileSync } from 'fs';
import { stdout } from 'process';
import { writeFileSync } from 'fs';

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
  attribution: string;
  dir: string;
  name: string;
  type: 'image' | 'tile';
} & (HistoricalSourceImage | HistoricalSourceTile);

type HistoricalSourceImage = {
  featherFilter?: string;
  featherWidth?: [number, 'feet' | 'miles'];
  feathered?: boolean;
  filter?: string;
  masked: boolean;
  type: 'image';
};

type HistoricalSourceTile = {
  maxZoom: number;
  minZoom: number;
  type: 'tile';
};

const bucket = 'munimap-historical-images';

const curated: Record<string, Record<string, HistoricalSource[]>> = {
  SULLIVAN: {
    WASHINGTON: [
      {
        attribution: 'HF Walling',
        dir: './bin/assets/washington-1860',
        maxZoom: 15,
        minZoom: 13,
        name: '1860 HF Walling',
        type: 'tile'
      },
      {
        attribution: 'DH Hurd',
        dir: './bin/assets/washington-1892',
        maxZoom: 15,
        minZoom: 13,
        name: '1892 DH Hurd',
        type: 'tile'
      },
      {
        attribution: 'USGS',
        dir: './bin/assets/washington-hwy-1930',
        maxZoom: 15,
        minZoom: 13,
        name: '1930 Hwy Dept',
        type: 'tile'
      },
      {
        attribution: 'USGS',
        dir: './bin/assets/washington-usgs-1930',
        maxZoom: 15,
        minZoom: 13,
        name: '1930 USGS',
        type: 'tile'
      },
      {
        attribution: 'USGS',
        dir: './bin/assets/washington-usgs-1942',
        masked: true,
        name: '1942 USGS',
        type: 'image'
      },
      {
        attribution: 'USGS',
        dir: './bin/assets/washington-usgs-1957',
        masked: true,
        name: '1957 USGS',
        type: 'image'
      },
      {
        attribution: 'USGS',
        dir: './bin/assets/washington-usgs-1984',
        masked: true,
        name: '1984 USGS',
        type: 'image'
      }
    ]
  }
};

const client = new S3Client({});

const dist = './lib/assets';

const historicalMaps: HistoricalMapIndex = {};

const s3Domain = `s3.${env.AWS_BUCKET ?? 'us-east-1'}.amazonaws.com`;

function main(): void {
  // 👇 for each curated county, town

  Object.keys(curated).forEach((county) => {
    Object.keys(curated[county]).forEach((town) => {
      const path = `${theState}:${county}:${town}`;
      historicalMaps[path] = [];

      // 👇 for each historical map ...
      curated[county][town].forEach(async (source: HistoricalSource) => {
        // 👇 start the copy process
        console.log(chalk.green(`... writing ${source.name} to ${path}`));

        // 👇 type IMAGE
        if (source.type === 'image') {
          // 👇 load the metadata describing the image
          const metadata = JSON.parse(
            readFileSync(`${source.dir}/metadata.json`).toString()
          );
          const layer = metadata.layers.find(
            (layer) => layer.type === 'GeoImage'
          );

          // 👇 populate the historical map descriptor
          historicalMaps[path].push({
            attribution: source.attribution,
            center: layer.imageCenter,
            feathered: source.feathered,
            featherFilter: source.featherFilter,
            featherWidth: source.featherWidth,
            filter: source.filter,
            masked: source.masked,
            name: source.name,
            rotate: layer.imageRotate,
            scale: layer.imageScale,
            type: 'image',
            url: `https://${bucket}.${s3Domain}/${path}/${source.name}.jpeg`
          } satisfies HistoricalMap);

          // 👇 upload the untiled map image to S3
          const buffer = readFileSync(`${source.dir}/map.jpeg`);
          await client.send(
            new PutObjectCommand({
              Bucket: bucket,
              Key: `${path}/${source.name}.jpeg`,
              Body: buffer,
              ContentType: 'image/jpeg'
            })
          );

          // 👇 log progress
          console.log(
            chalk.yellow(
              `...... S3 object ${path}/${source.name}.jpeg uploaded`
            )
          );
        }

        // 👇 upload the map tiles to S3
        if (source.type === 'tile') {
          // 👇 populate the historical map descriptor
          historicalMaps[path].push({
            attribution: source.attribution,
            maxZoom: source.maxZoom,
            minZoom: source.minZoom,
            name: source.name,
            type: 'tile',
            url: `https://${bucket}.${s3Domain}/${path}/${source.name}/tiles/{z}/{x}/{y}.jpg`
          } satisfies HistoricalMap);

          // 👇 load and parse the zip of tiles
          const zip = await JSZip.loadAsync(
            readFileSync(`${source.dir}/tiles.zip`)
          );
          const entries = zip.filter((path, file) => !file.dir);

          // 👇 upload the map tiles to S3
          for (const entry of entries) {
            const buffer = await entry.async('nodebuffer');
            await client.send(
              new PutObjectCommand({
                Bucket: bucket,
                Key: `${path}/${source.name}/${entry.name}`,
                Body: buffer,
                ContentType: 'image/jpeg'
              })
            );
            stdout.write('.');
          }

          // 👇 log progress
          console.log(
            chalk.yellow(
              `...... ${entries.length} S3 objects for ${path}/${source.name} tiles uploaded`
            )
          );
        }
      });
    });
  });

  // 👇 finally write out the manifest

  console.log(chalk.green(`... writing ${dist}/historicals.json`));
  writeFileSync(
    `${dist}/historicals.json`,
    JSON.stringify(historicalMaps, null, 2)
  );
}

main();
