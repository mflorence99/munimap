import { Landmark } from '../lib/src/common';
import { LandmarkProperties } from '../lib/src/common';
import { LandmarkPropertiesClass } from '../lib/src/common';
import { Landmarks } from '../lib/src/common';

import { calculateLandmark } from '../lib/src/common';
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
  geojson?: Landmarks;
  properties: LandmarkProperties;
  source?: string;
  textLocations?: [number, number][];
}

interface Curation {
  landmarks: CuratedLandmark[];
  owner: string;
  path: string;
}

const CURATIONS: Curation[] = [
  // ///////////////////////////////////////////////////////////////////
  // 👇 Florence/Hendrickson property bootstrap data
  // ///////////////////////////////////////////////////////////////////
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
          fontFeet: 16,
          fontOpacity: 1,
          fontOutline: true,
          fontStyle: 'normal',
          iconOpacity: 1,
          iconSymbol: '\uf1ce' /* 👈 circle-notch */,
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
          strokeOutline: true,
          strokeOutlineColor: '--map-road-edge-VI',
          strokePattern: 'conglomerate',
          strokePatternScale: 0.66,
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
          fillOpacity: 1,
          fontColor: '--map-place-water-color',
          fontOpacity: 1,
          fontOutline: true,
          fontSize: 'medium',
          fontStyle: 'italic',
          textRotate: true
        }),
        source: './proxy/assets/landmarks/florence/ponds.gpx'
      },
      {
        properties: new LandmarkPropertiesClass({
          fontColor: '--map-place-water-color',
          fontOpacity: 1,
          fontOutline: true,
          fontSize: 'medium',
          fontStyle: 'italic'
        }),
        source: './proxy/assets/landmarks/florence/rivermarks.gpx'
      },
      {
        properties: new LandmarkPropertiesClass({
          fontColor: '--map-place-water-color',
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
          fontColor: '--map-place-water-color',
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
  },
  // ///////////////////////////////////////////////////////////////////
  // 👇 Tom Cross's map amendments
  // ///////////////////////////////////////////////////////////////////
  {
    landmarks: [
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
              properties: { name: 'Private Way' },
              type: 'Feature'
            }
          ],
          type: 'FeatureCollection'
        },
        properties: new LandmarkPropertiesClass({
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
        })
      },
      {
        geojson: {
          features: [
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
              properties: { name: 'Ashuelot River' },
              type: 'Feature'
            }
          ],
          type: 'FeatureCollection'
        },
        properties: new LandmarkPropertiesClass({
          fontColor: '--map-place-water-color',
          fontOpacity: 1,
          fontOutline: true,
          fontSize: 'large',
          fontStyle: 'bold'
        })
      }
    ],
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
      // 👉 source is external GPX or inline GeoJSON
      const geojson = curated.source
        ? gpx(
            new DOMParser().parseFromString(
              readFileSync(curated.source).toString(),
              'text/xml'
            )
          )
        : curated.geojson;

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
            // 🔥 don't know why we do this -- just popped up in new OL version
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
            munged = lineToPolygon(feature.geometry as any).geometry;
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
}

main();
