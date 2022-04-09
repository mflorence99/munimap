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
  centers?: [number, number][];
  geoOp?: 'lineToPolygon' | null;
  properties: LandmarkProperties;
  source: string;
}

interface Curation {
  landmarks: CuratedLandmark[];
  owner: string;
  path: string;
}

const CURATIONS: Curation[] = [
  {
    landmarks: [
      {
        properties: {
          fontColor: '--map-building-outline',
          fontOpacity: 1,
          fontOutline: true,
          fontSize: 'medium',
          fontStyle: 'italic'
        },
        source: './proxy/assets/landmarks/florence/buildings.gpx'
      },
      {
        properties: {
          fontColor: '--rgb-blue-gray-600',
          fontOpacity: 1,
          fontOutline: true,
          fontSize: 'small',
          fontStyle: 'normal',
          icon: '\uf1ce' /* 👈 circle-notch */,
          minZoom: 18
        },
        source: './proxy/assets/landmarks/florence/culverts.gpx'
      },
      {
        properties: {
          strokeColor: '--map-river-line-color',
          strokeOpacity: 1,
          strokeStyle: 'dashed',
          strokeWidth: 'thin'
        },
        source: './proxy/assets/landmarks/florence/ditches.gpx'
      },
      {
        properties: {
          strokeColor: '--map-road-lane-VI',
          strokeOpacity: 1,
          strokeStyle: 'solid',
          strokeWidth: 'extra',
          zIndex: 1
        },
        source: './proxy/assets/landmarks/florence/driveway.gpx'
      },
      {
        properties: {
          fontColor: '--map-place-text-color',
          fontOpacity: 1,
          fontOutline: true,
          fontSize: 'large',
          fontStyle: 'italic'
        },
        source: './proxy/assets/landmarks/florence/landmarks.gpx'
      },
      {
        centers: [
          [-72.029653581079, 43.204750066490675],
          null,
          [-72.02846833057752, 43.207956756285625]
        ],
        geoOp: 'lineToPolygon',
        properties: {
          fillColor: '--map-parcel-fill-u190',
          fillOpacity: 0.15,
          fontColor: '--map-conservation-outline',
          fontOpacity: 1,
          fontSize: 'small',
          fontStyle: 'normal',
          showAcreage: true,
          zIndex: -1
        },
        source: './proxy/assets/landmarks/florence/mow.gpx'
      },
      {
        geoOp: 'lineToPolygon',
        properties: {
          fillColor: '--map-waterbody-fill',
          fillOpacity: 1
        },
        source: './proxy/assets/landmarks/florence/ponds.gpx'
      },
      {
        properties: {
          strokeColor: '--map-river-line-color',
          strokeOpacity: 1,
          strokeStyle: 'solid',
          strokeWidth: 'medium'
        },
        source: './proxy/assets/landmarks/florence/streams.gpx'
      },
      {
        properties: {
          fontColor: '--map-trail-text-color',
          fontOpacity: 1,
          fontSize: 'medium',
          fontStyle: 'italic'
        },
        source: './proxy/assets/landmarks/florence/trailmarks.gpx'
      },
      {
        properties: {
          strokeColor: '--map-trail-line-color',
          strokeOpacity: 1,
          strokeStyle: 'dashed',
          strokeWidth: 'medium',
          zIndex: 1
        },
        source: './proxy/assets/landmarks/florence/trails.gpx'
      },
      {
        properties: {
          fontColor: '--map-river-text-color',
          fontOpacity: 1,
          fontOutline: true,
          fontSize: 'medium',
          fontStyle: 'italic'
        },
        source: './proxy/assets/landmarks/florence/rivermarks.gpx'
      },
      {
        properties: {
          fontColor: '--map-river-text-color',
          fontOpacity: 1,
          fontOutline: true,
          fontSize: 'medium',
          fontStyle: 'italic'
        },
        source: './proxy/assets/landmarks/florence/watermarks.gpx'
      }
    ],
    owner: 'mflo999+flo@gmail.com',
    path: 'NEW HAMPSHIRE:SULLIVAN:WASHINGTON'
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
  let numDeleted = 0;
  const curated = await landmarks.where('curated', '==', true).get();
  for (const doc of curated.docs) {
    await doc.ref.delete();
    process.stdout.write('.');
    numDeleted += 1;
  }

  console.log(`${numDeleted} previously curated landmarks deleted`);

  // 👇 for each curation ...
  for (const curation of CURATIONS) {
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

      // 👉 for each feature ...
      const promises = [];
      for (let ix = 0; ix < geojson.features.length; ix++) {
        const feature = geojson.features[ix];

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
            ...curated.properties,
            center: curated.centers?.[ix] ?? null,
            name: feature.properties.name ?? null
          },
          type: 'Feature'
        };

        // 👇 write out the landmark
        serializeLandmark(landmark);
        promises.push(landmarks.add(landmark));
      }

      await Promise.all(promises);
      console.log(
        chalk.blue(`...... waiting for ${promises.length} promises to resolve`)
      );
    }
  }
}

main();
