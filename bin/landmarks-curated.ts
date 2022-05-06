import { Landmark } from '../lib/src/common';
import { LandmarkPropertiesClass } from '../lib/src/common';
import { Landmarks } from '../lib/src/common';

import { calculateLandmark } from '../lib/src/common';
import { makeLandmarkID } from '../lib/src/common';
import { serializeLandmark } from '../lib/src/common';

import * as firebase from 'firebase-admin/app';
import * as firestore from 'firebase-admin/firestore';
import * as inquirer from 'inquirer';
import * as yargs from 'yargs';

import { readFileSync } from 'fs';

import chalk from 'chalk';

interface Curation {
  geojson?: Landmarks;
  owner: string;
  path: string;
  source?: string;
}

const CURATIONS: Curation[] = [
  // ///////////////////////////////////////////////////////////////////
  // 👇 Florence/Hendrickson property bootstrap data
  // ///////////////////////////////////////////////////////////////////
  {
    owner: 'mflo999+flo@gmail.com',
    path: 'NEW HAMPSHIRE:SULLIVAN:WASHINGTON',
    source: './proxy/assets/florence-landmarks.geojson'
  },
  // ///////////////////////////////////////////////////////////////////
  // 👇 Tom Cross's map amendments
  // ///////////////////////////////////////////////////////////////////
  {
    geojson: {
      features: [
        {
          geometry: {
            type: 'LineString',
            coordinates: [
              [-72.15684443476792, 43.15072211573772],
              [-72.15680718420808, 43.15063152763469],
              [-72.15662093140892, 43.15045035102571],
              [-72.15605596458481, 43.150133290667696],
              [-72.15593179605203, 43.150042701691916],
              [-72.15580141909263, 43.14991134743849],
              [-72.15549720618732, 43.14971658026727],
              [-72.15521782698858, 43.14960787273901],
              [-72.15503778261606, 43.14952634196598],
              [-72.15460319275135, 43.14924098340387],
              [-72.1544169399522, 43.149105097906045],
              [-72.15398235008749, 43.14882879646214],
              [-72.1538085141416, 43.14869291004791],
              [-72.15363467819571, 43.14859778937824],
              [-72.15350430123631, 43.1484754911568],
              [-72.15344842539655, 43.1483396039572],
              [-72.15340496641008, 43.14818106850913],
              [-72.15340496641008, 43.14797270700919]
            ]
          },
          properties: {
            ...new LandmarkPropertiesClass({
              fontColor: '--map-road-edge-VI',
              fontOpacity: 1,
              fontOutline: true,
              fontSize: 'medium',
              fontStyle: 'bold',
              lineSpline: true,
              strokeColor: '--map-road-lane-VI',
              strokeFeet: 48 /* 👈 feet */,
              strokeOpacity: 1,
              strokeOutline: true,
              strokeOutlineColor: '--map-road-edge-VI',
              strokePattern: 'conglomerate',
              strokePatternScale: 0.66,
              strokeStyle: 'solid',
              zIndex: 1
            }),
            name: 'Private Way'
          },
          type: 'Feature'
        },
        {
          geometry: {
            type: 'LineString',
            coordinates: [
              [-72.15666439039539, 43.15076288034035],
              [-72.15670784938186, 43.15069946872458],
              [-72.15696239487404, 43.150468468710756],
              [-72.15708035498018, 43.150318997648384],
              [-72.15711139711337, 43.150196702870886],
              [-72.15717348137976, 43.150074407848706],
              [-72.15719210665968, 43.14999740715368],
              [-72.15719210665968, 43.14977546343101],
              [-72.1572107319396, 43.149743757119126],
              [-72.15723556564616, 43.149562577878555],
              [-72.1572914414859, 43.14935875059095]
            ]
          },
          properties: {
            ...new LandmarkPropertiesClass({
              fontColor: '--map-place-water-color',
              fontOpacity: 1,
              fontOutline: true,
              fontSize: 'large',
              fontStyle: 'bold'
            }),
            name: 'Ashuelot River'
          },
          type: 'Feature'
        }
      ],
      type: 'FeatureCollection'
    },
    owner: 'mflo999@gmail.com',
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
  if (!useEmulator) {
    const response = await inquirer.prompt([
      {
        type: 'input',
        name: 'proceed',
        choices: ['y', 'n'],
        message: 'WARNING: running on live Firestore. Proceed? (y/N)'
      }
    ]);
    if (response.proceed.toLowerCase() !== 'y') return;
  }

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

    // 👉 source is external GPX or inline GeoJSON
    const geojson = curation.source
      ? JSON.parse(readFileSync(curation.source).toString())
      : curation.geojson;

    // 👉 for each feature ...
    const promises = [];
    for (let ix = 0; ix < geojson.features.length; ix++) {
      const feature = geojson.features[ix];

      console.log(
        chalk.yellow(
          `...... adding curated landmark ${feature.properties.name}`
        )
      );

      // 👇 construct the new landmark
      const landmark: Landmark = {
        curated: true,
        geometry: feature.geometry,
        id: null,
        owner: curation.owner,
        path: curation.path,
        properties: feature.properties,
        type: 'Feature'
      };

      // 👇 so that they can't get duplicated
      landmark.id = makeLandmarkID(landmark);

      // 👇 write out the landmark
      calculateLandmark(landmark);
      serializeLandmark(landmark);
      promises.push(landmarks.doc(landmark.id).set(landmark));
    }

    await Promise.all(promises);
    console.log(
      chalk.blue(`...... waiting for ${promises.length} promises to resolve`)
    );
  }
}

main();
