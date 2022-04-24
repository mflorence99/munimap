import { Landmark } from '../lib/src/common';
import { LandmarkProperties } from '../lib/src/common';
import { LandmarkPropertiesClass } from '../lib/src/common';

import { makeLandmarkID } from '../lib/src/common';
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
  geoOp?: 'lineToPolygon' | null;
  properties: LandmarkProperties;
  source: string;
  textLocations?: [number, number][];
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
        properties: new LandmarkPropertiesClass({
          fontColor: '--map-building-outline',
          fontOpacity: 1,
          fontOutline: true,
          fontSize: 'medium',
          fontStyle: 'italic'
        }),
        source: './proxy/assets/landmarks/florence/buildings.gpx'
      },
      {
        properties: new LandmarkPropertiesClass({
          fontColor: '--rgb-blue-gray-600',
          fontOpacity: 1,
          fontOutline: true,
          fontSize: 'small',
          fontStyle: 'normal',
          iconOpacity: 1,
          iconSymbol: '\uf1ce' /* 👈 circle-notch */,
          minZoom: 18,
          textAlign: 'center',
          textBaseline: 'bottom'
        }),
        source: './proxy/assets/landmarks/florence/culverts.gpx'
      },
      {
        properties: new LandmarkPropertiesClass({
          lineDash: [1, 1],
          lineSpline: true,
          strokeColor: '--map-river-line-color',
          strokeOpacity: 1,
          strokeStyle: 'dashed',
          strokeWidth: 'thin'
        }),
        source: './proxy/assets/landmarks/florence/ditches.gpx'
      },
      {
        properties: new LandmarkPropertiesClass({
          lineSpline: true,
          strokeColor: '--map-road-lane-VI',
          strokeFeet: 15 /* 👈 feet */,
          strokeOpacity: 1,
          strokeStyle: 'solid',
          zIndex: 1
        }),
        source: './proxy/assets/landmarks/florence/driveway.gpx'
      },
      {
        properties: new LandmarkPropertiesClass({
          fontColor: '--map-place-text-color',
          fontOpacity: 1,
          fontOutline: true,
          fontSize: 'large',
          fontStyle: 'italic'
        }),
        source: './proxy/assets/landmarks/florence/landmarks.gpx'
      },
      {
        textLocations: [
          [-72.029653581079, 43.204750066490675],
          [-72.02895441874323, 43.20527435243358],
          [-72.02846833057752, 43.207956756285625]
        ],
        geoOp: 'lineToPolygon',
        properties: new LandmarkPropertiesClass({
          fillColor: '--map-parcel-fill-u190',
          fillOpacity: 0.15,
          fontColor: '--map-conservation-outline',
          fontOpacity: 1,
          fontSize: 'small',
          fontStyle: 'normal',
          showDimension: true,
          zIndex: -1
        }),
        source: './proxy/assets/landmarks/florence/mow.gpx'
      },
      {
        geoOp: 'lineToPolygon',
        properties: new LandmarkPropertiesClass({
          fillColor: '--map-waterbody-fill',
          fillOpacity: 1
        }),
        source: './proxy/assets/landmarks/florence/ponds.gpx'
      },
      {
        properties: new LandmarkPropertiesClass({
          fontColor: '--map-river-text-color',
          fontOpacity: 1,
          fontOutline: true,
          fontSize: 'medium',
          fontStyle: 'italic'
        }),
        source: './proxy/assets/landmarks/florence/rivermarks.gpx'
      },
      {
        properties: new LandmarkPropertiesClass({
          fontColor: '--map-river-text-color',
          fontOpacity: 1,
          fontOutline: true,
          fontSize: 'medium',
          fontStyle: 'italic',
          lineChunk: true,
          lineSpline: true,
          strokeColor: '--map-river-line-color',
          strokeOpacity: 1,
          strokeStyle: 'solid',
          strokeWidth: 'medium'
        }),
        source: './proxy/assets/landmarks/florence/streams.gpx'
      },
      {
        geoOp: 'lineToPolygon',
        properties: new LandmarkPropertiesClass({
          fillColor: '--map-wetland-swamp',
          fillOpacity: 0.5,
          fillPattern: 'swamp'
        }),
        source: './proxy/assets/landmarks/florence/swamp.gpx'
      },
      {
        properties: new LandmarkPropertiesClass({
          fontColor: '--map-trail-text-color',
          fontOpacity: 1,
          fontOutline: true,
          fontSize: 'medium',
          fontStyle: 'italic',
          lineChunk: true,
          lineDash: [2, 1],
          lineSpline: true,
          showDimension: true,
          strokeColor: '--map-trail-line-color',
          strokeOpacity: 1,
          strokeStyle: 'dashed',
          strokeWidth: 'medium',
          zIndex: 1
        }),
        source: './proxy/assets/landmarks/florence/trails.gpx'
      },
      {
        properties: new LandmarkPropertiesClass({
          fontColor: '--map-river-text-color',
          fontOpacity: 1,
          fontOutline: true,
          fontSize: 'medium',
          fontStyle: 'italic'
        }),
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
          id: null,
          owner: curation.owner,
          path: curation.path,
          properties: {
            ...curated.properties,
            textLocation: curated.textLocations?.[ix] ?? null,
            name: feature.properties.name ?? null
          },
          type: 'Feature'
        };

        // 👇 so that they can't get duplicated
        landmark.id = makeLandmarkID(landmark);

        // 👇 write out the landmark
        serializeLandmark(landmark);
        promises.push(landmarks.doc(landmark.id).set(landmark));
      }

      await Promise.all(promises);
      console.log(
        chalk.blue(`...... waiting for ${promises.length} promises to resolve`)
      );
    }
  }
}

main();
