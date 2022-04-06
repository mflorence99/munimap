/* eslint-disable @typescript-eslint/naming-convention */

import { Building } from '../lib/src/geojson';
import { Buildings } from '../lib/src/geojson';

import { calculateOrientation } from '../lib/src/geojson';
import { theState } from '../lib/src/geojson';

import { getCoords } from '@turf/invariant';
import { mkdirSync } from 'fs';
import { readFileSync } from 'fs';
import { writeFileSync } from 'fs';

import angle from '@turf/angle';
import bbox from '@turf/bbox';
import bboxPolygon from '@turf/bbox-polygon';
import chalk from 'chalk';
import transformRotate from '@turf/transform-rotate';

const loadem = (fn): Buildings => JSON.parse(readFileSync(fn).toString());

// console.log(
//   angle([-72.09239, 43.17331], [-72.09237, 43.17332], [-72.09235, 43.17329])
// );

// 👇 some towns have curated buildings

const curated = {
  SULLIVAN: {
    WASHINGTON: loadem('./proxy/assets/washington-buildings.geojson')
  }
};

const dist = './data';

// const testFeature = {
//   type: 'Feature',
//   properties: { name: '' },
//   geometry: {
//     type: 'Polygon',
//     coordinates: [
//       [
//         [-72.02988, 43.2042],
//         [-72.02978, 43.20426],
//         [-72.02984, 43.20431],
//         [-72.02994, 43.20425],
//         [-72.02988, 43.2042]
//       ]
//     ]
//   },
//   id: 'f5f283e159b3125ff5d2bacd745422d2'
// } as any;

function isHandDrawn(feature: Building): boolean {
  return (
    feature.geometry.type === 'Polygon' &&
    feature.geometry.coordinates[0].length >= 5 &&
    feature.geometry.coordinates[0].length <= 16
  );
}

function isSquared(feature: Building): boolean {
  let isSquared = true;
  const coords = getCoords(feature)[0];
  for (let i = 0; i < coords.length - 2; i++) {
    let theta = Math.round(angle(coords[i], coords[i + 1], coords[i + 2]));
    if (theta > 180) theta = 360 - theta;
    // console.log({ theta });
    if (theta > 90 || theta < 90) {
      isSquared = false;
      break;
    }
  }
  return isSquared;
}

// 👇 for each curated county, town

Object.keys(curated).forEach((county) => {
  Object.keys(curated[county]).forEach((town) => {
    const geojson = curated[county][town];

    geojson.features.forEach((feature) => {
      if (isHandDrawn(feature) && !isSquared(feature)) {
        // 👇 calculate the orientation of the building outline
        const theta = calculateOrientation(feature);

        // 👇 rotate it level, expand to bbox, then rotate it back
        let munged = transformRotate(feature, theta * -1);
        munged = bboxPolygon(bbox(munged));
        munged = transformRotate(munged, theta);
        feature.geometry.coordinates = munged.geometry.coordinates;
        // console.log(feature.geometry.coordinates);
      }
    });

    console.log(
      chalk.green(`... writing ${theState}/${county}/${town}/buildings.geojson`)
    );
    mkdirSync(`${dist}/${theState}/${county}/${town}`, { recursive: true });
    // 👎 CANNOT use simplify due to accuracy needed in buildings
    writeFileSync(
      `${dist}/${theState}/${county}/${town}/buildings.geojson`,
      JSON.stringify(geojson)
    );
  });
});
