import { HistoricalMapIndex } from '../lib/src/common.ts';

import { theState } from '../lib/src/common.ts';

import { GetObjectAttributesCommand } from '@aws-sdk/client-s3';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { S3Client } from '@aws-sdk/client-s3';
import { Units } from '@turf/helpers';

import { env } from 'node:process';
import { readFileSync } from 'node:fs';
import { stdout } from 'node:process';
import { writeFileSync } from 'node:fs';

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
  type: 'image' | 'xyz';
} & (HistoricalSourceImage | HistoricalSourceXYZ);

type HistoricalSourceImage = {
  featherFilter?: string;
  featherWidth?: [number, Units];
  feathered?: boolean;
  filter?: string;
  masked: boolean;
  type: 'image';
};

type HistoricalSourceXYZ = {
  maxZoom: number;
  minZoom: number;
  type: 'xyz';
};

const bucket = 'munimap-historical-images';

type County = string;
type Town = string;

const curated: Record<County, Record<Town, HistoricalSource[]>> = {
  SULLIVAN: {
    WASHINGTON: [
      {
        attribution: 'HF Walling',
        dir: './bin/assets/washington-1860',
        maxZoom: 15,
        minZoom: 13,
        name: '1860 HF Walling',
        type: 'xyz'
      },
      {
        attribution: 'R&G Jager',
        dir: './bin/assets/washington-1860-schools',
        maxZoom: 15,
        minZoom: 13,
        name: '1860 Schools',
        type: 'xyz'
      },
      {
        attribution: 'DH Hurd',
        dir: './bin/assets/washington-1892',
        maxZoom: 15,
        minZoom: 13,
        name: '1892 DH Hurd',
        type: 'xyz'
      },
      {
        attribution: 'USGS',
        dir: './bin/assets/washington-usgs-1930',
        maxZoom: 15,
        minZoom: 13,
        name: '1930 USGS',
        type: 'xyz'
      },
      {
        attribution: 'USGS',
        dir: './bin/assets/washington-usgs-1942',
        maxZoom: 15,
        minZoom: 13,
        name: '1942 USGS',
        type: 'xyz'
      },
      {
        attribution: 'USGS',
        dir: './bin/assets/washington-usgs-1957',
        maxZoom: 15,
        minZoom: 13,
        name: '1957 USGS',
        type: 'xyz'
      },
      {
        attribution: 'USGS',
        dir: './bin/assets/washington-usgs-1964',
        maxZoom: 15,
        minZoom: 13,
        name: '1964 USGS',
        type: 'xyz'
      },
      {
        attribution: 'Yusko & Williams',
        dir: './bin/assets/washington-yusko-1976',
        maxZoom: 15,
        minZoom: 13,
        name: '1976 Portrait of Hill Town',
        type: 'xyz'
      },
      {
        attribution: 'USGS',
        dir: './bin/assets/washington-usgs-1984',
        maxZoom: 15,
        minZoom: 13,
        name: '1984 USGS',
        type: 'xyz'
      },
      {
        attribution: 'USGS',
        dir: './bin/assets/washington-usgs-1998',
        maxZoom: 15,
        minZoom: 13,
        name: '1998 USGS',
        type: 'xyz'
      }
    ]
  }
};

const client = new S3Client({});

const dist = './lib/assets';

const historicalMaps: HistoricalMapIndex = {};

const s3Domain = `s3.${env.AWS_BUCKET ?? 'us-east-1'}.amazonaws.com`;

async function main(): Promise<void> {
  // 👇 for each curated county, town

  for (const county of Object.keys(curated)) {
    for (const town of Object.keys(curated[county])) {
      const path = `${theState}:${county}:${town}`;
      historicalMaps[path] = [];

      // 👇 for each historical map ...
      for (const source of curated[county][town]) {
        // 👇 type IMAGE
        if (source.type === 'image') {
          // 👇 start the copy process
          console.log(
            chalk.green(`... writing ${source.name} image to ${path}`)
          );

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
          });

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
        if (source.type === 'xyz') {
          // 👇 start the copy process
          console.log(
            chalk.blue(`... processing ${source.name} tiles to ${path}`)
          );

          // 👇 populate the historical map descriptor
          historicalMaps[path].push({
            attribution: source.attribution,
            maxZoom: source.maxZoom,
            minZoom: source.minZoom,
            name: source.name,
            type: 'xyz',
            url: `https://${bucket}.${s3Domain}/${path}/${source.name}/tiles/{z}/{x}/{y}.jpg`
          });

          // 👇 load and parse the zip of tiles
          const zip = await JSZip.loadAsync(
            readFileSync(`${source.dir}/tiles.zip`)
          );
          const entries = zip.filter((path, file) => !file.dir);

          // 👇 upload the map tiles to S3
          let count = 0;
          for (const entry of entries) {
            let s3Object;

            // 👇 first read it to see if changed
            try {
              s3Object = await client.send(
                new GetObjectAttributesCommand({
                  Bucket: bucket,
                  Key: `${path}/${source.name}/${entry.name}`,
                  ObjectAttributes: ['ETag']
                })
              );
            } catch (e) {
              console.error(e.message);
            }

            // 👇 if zip entry is newer than s3 object, write a new one
            if (
              !s3Object ||
              entry.date.getTime() >
                new Date(s3Object['LastModified']).getTime()
            ) {
              const buffer = await entry.async('nodebuffer');
              await client.send(
                new PutObjectCommand({
                  Bucket: bucket,
                  Key: `${path}/${source.name}/${entry.name}`,
                  Body: buffer,
                  ContentType: 'image/jpeg'
                })
              );
              stdout.write('+');
              count += 1;
            } else stdout.write('.');
          }
          stdout.write('\n');

          // 👇 log progress
          if (count > 0) {
            console.log(
              chalk.yellow(
                `...... ${count} S3 objects for ${path}/${source.name} tiles uploaded`
              )
            );
          }
        }
      }
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
