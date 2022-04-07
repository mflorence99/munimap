import { Landmark } from '../lib/src/common';
import { LandmarkProperties } from '../lib/src/common';

import { serializeLandmark } from '../lib/src/common';

import * as firebase from 'firebase-admin/app';
import * as firestore from 'firebase-admin/firestore';
import * as yargs from 'yargs';

import { DOMParser } from '@xmldom/xmldom';

import { gpx } from '@tmcw/togeojson';
import { readFileSync } from 'fs';

import chalk from 'chalk';
import lineToPolygon from '@turf/line-to-polygon';

interface CuratedLandmark {
  geoOp: undefined | 'lineToPolygon';
  source: string;
}

interface Curation {
  landmarks: CuratedLandmark[];
  owner: string;
  path: string;
  properties: LandmarkProperties;
}

const curations: Curation[] = [
  {
    landmarks: [
      {
        geoOp: 'lineToPolygon',
        source: './proxy/assets/landmarks/florence/mow.gpx'
      }
    ],
    owner: 'mflo999@gmail.com',
    path: 'NEW HAMPSHIRE:SULLIVAN:WASHINGTON',
    properties: {}
  }
];

// 👇 https://github.com/firebase/firebase-admin-node/issues/776

const useEmulator = yargs.argv['useEmulator'];

if (useEmulator) process.env['FIRESTORE_EMULATOR_HOST'] = 'localhost:8080';

// 👇 https://stackoverflow.com/questions/49691215/cloud-functions-how-to-copy-firestore-collection-to-a-new-document

firebase.initializeApp({
  credential: firebase.cert('./firebase-admin.json'),
  databaseURL: 'https://washington-app-319514.firebaseio.com'
});

const db = firestore.getFirestore();
const landmarks = db.collection('landmarks');

async function main(): Promise<void> {
  // 👇 delete all curated Landmarks
  const curated = await landmarks.where('curated', '==', true).get();
  curated.forEach((doc): any => doc.ref.delete());

  // 👇 for each curation ...
  for (const curation of curations) {
    console.log(
      chalk.green(
        `... processing curation for ${curation.owner} in ${curation.path}`
      )
    );

    // 👇 for each landmark ...
    for (const curated of curation.landmarks) {
      const geojson = gpx(
        new DOMParser().parseFromString(
          readFileSync(curated.source).toString(),
          'text/xml'
        )
      );
      for (const feature of geojson.features) {
        console.log(
          chalk.yellow(
            `...... adding curated landmark ${feature.properties.name}`
          )
        );

        // 👇 munge to geometry
        let munged;
        switch (curated.geoOp) {
          case 'lineToPolygon':
            munged = lineToPolygon(feature.geometry).geometry;
            break;
          default:
            munged = feature.geometry;
            break;
        }

        // 👇 construct the new landmark
        const landmark: Landmark = {
          curated: true,
          geometry: munged,
          owner: curation.owner,
          path: curation.path,
          properties: {
            ...curation.properties,
            name: feature.properties.name
          },
          type: 'Feature'
        };

        // 👇 write out the landmark
        serializeLandmark(landmark);
        await landmarks.add(landmark);
      }
    }
  }
}

main();
