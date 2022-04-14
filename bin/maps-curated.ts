import { Parcel } from '../lib/src/common';
import { ParcelID } from '../lib/src/common';
import { Parcels } from '../lib/src/common';

import { bboxByAspectRatio } from '../lib/src/common';
import { deserializeParcel } from '../lib/src/common';

import * as firebase from 'firebase-admin/app';
import * as firestore from 'firebase-admin/firestore';
import * as yargs from 'yargs';

import { readFileSync } from 'fs';

import bboxPolygon from '@turf/bbox-polygon';
import chalk from 'chalk';
import union from '@turf/union';

const dist = './data';

const MAPS = [
  {
    bbox: null,
    id: 'henniker',
    isDflt: false,
    name: 'Henniker',
    owner: 'mflo999+flo@gmail.com',
    path: 'NEW HAMPSHIRE:MERRIMACK:HENNIKER',
    printSize: [45, 60],
    type: 'parcels'
  },
  {
    bbox: null,
    id: 'washington',
    isDflt: false,
    name: 'Town of Washington',
    owner: 'mflo999@gmail.com',
    path: 'NEW HAMPSHIRE:SULLIVAN:WASHINGTON',
    printSize: [45, 60],
    type: 'parcels'
  },
  {
    bbox: null,
    cxFeet: 15840,
    cyFeet: 10560,
    id: 'washington-center',
    isDflt: false,
    name: 'Town Center',
    origin: [-72.13330520983168, 43.18490951655938],
    owner: 'mflo999@gmail.com',
    path: 'NEW HAMPSHIRE:SULLIVAN:WASHINGTON',
    printSize: [24, 36],
    type: 'area'
  },
  {
    bbox: null,
    cxFeet: 10560,
    cyFeet: 10560,
    id: 'washington-east',
    isDflt: false,
    name: 'East Washington',
    origin: [-72.04833282823988, 43.21047135814069],
    owner: 'mflo999@gmail.com',
    path: 'NEW HAMPSHIRE:SULLIVAN:WASHINGTON',
    printSize: [24, 24],
    type: 'area'
  },
  {
    bbox: null,
    cxFeet: 15840,
    cyFeet: 10560,
    id: 'washington-highland',
    isDflt: false,
    name: 'Highland Lake',
    origin: [-72.10798515673109, 43.157376566018925],
    owner: 'mflo999@gmail.com',
    path: 'NEW HAMPSHIRE:SULLIVAN:WASHINGTON',
    printSize: [24, 36],
    type: 'area'
  },
  {
    bbox: null,
    cxFeet: 10560,
    cyFeet: 10560,
    id: 'washington-island',
    isDflt: false,
    name: 'Island Pond',
    origin: [-72.07845939989515, 43.188444997708324],
    owner: 'mflo999@gmail.com',
    path: 'NEW HAMPSHIRE:SULLIVAN:WASHINGTON',
    printSize: [24, 24],
    type: 'area'
  },
  {
    bbox: null,
    cxFeet: 10560,
    cyFeet: 15840,
    id: 'washington-lae',
    isDflt: false,
    name: 'Lake Ashuelot Estates',
    origin: [-72.17305139671191, 43.17727946502029],
    owner: 'mflo999@gmail.com',
    path: 'NEW HAMPSHIRE:SULLIVAN:WASHINGTON',
    printSize: [24, 36],
    type: 'area'
  },
  {
    bbox: null,
    id: 'washington-topo',
    isDflt: false,
    name: 'Topographical Map of Washington',
    owner: 'mflo999@gmail.com',
    path: 'NEW HAMPSHIRE:SULLIVAN:WASHINGTON',
    printSize: [45, 60],
    type: 'topo'
  },
  {
    bbox: null,
    id: 'florence',
    isDflt: false,
    name: 'Florence/Hendrickson Estate',
    owner: 'mflo999+flo@gmail.com',
    parcelIDs: ['9-7', '(12-4)'],
    path: 'NEW HAMPSHIRE:SULLIVAN:WASHINGTON',
    printSize: [18, 24],
    type: 'property'
  },
  {
    bbox: null,
    id: 'marshall',
    isDflt: false,
    name: 'Marshall Estate',
    owner: 'marshal@gsinet.net',
    parcelIDs: ['9-6', '9-28'],
    path: 'NEW HAMPSHIRE:SULLIVAN:WASHINGTON',
    printSize: [18, 24],
    type: 'property'
  },
  {
    bbox: null,
    id: 'moskey',
    isDflt: false,
    name: 'Moskey Estate',
    owner: 'cmoskey@gmail.com',
    parcelIDs: [
      '(202-6)',
      '(401-36)',
      '1-633-A',
      '1-716',
      '1-717-A',
      '1-717-X',
      '1-717',
      '1-719-A',
      '1-721',
      '1-723-A',
      '1-723-B',
      '1-723',
      '1-724',
      '1-725'
    ],
    path: 'NEW HAMPSHIRE:MERRIMACK:HENNIKER',
    printSize: [30, 40],
    type: 'property'
  },
  {
    bbox: null,
    id: 'moskey-717',
    isDflt: false,
    name: 'Moskey Lot 1-717',
    owner: 'cmoskey@gmail.com',
    parcelIDs: ['1-717'],
    path: 'NEW HAMPSHIRE:MERRIMACK:HENNIKER',
    printSize: [17, 22],
    properties: {
      huc: '01070006'
    },
    type: 'property'
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
const maps = db.collection('maps');
const parcels = db.collection('parcels');

// 👀 old Washington App
const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;
const R_EARTH = 20902000; // feet

function bboxFromDimensions(map, border: number): number[] {
  const minX = map.origin[0];
  const minY = map.origin[1] - (map.cyFeet / R_EARTH) * RAD2DEG;
  const maxX =
    // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
    map.origin[0] +
    ((map.cxFeet / R_EARTH) * RAD2DEG) / Math.cos(map.origin[1] * DEG2RAD);
  const maxY = map.origin[1];
  const bounds = bboxPolygon([minX, minY, maxX, maxY]);
  return bboxByAspectRatio(bounds, map.printSize[1], map.printSize[0], border);
}

async function bboxFromParcelIDs(map, border: number): Promise<number[]> {
  const parcelsByID = loadGeoJSON(map);
  const stolenByID = await loadStolenParcels();
  const parcels: any[] = map.parcelIDs.map((parcelID) => {
    if (parcelID.startsWith('(')) return stolenByID[parcelID];
    else return parcelsByID[parcelID];
  });
  const bounds: GeoJSON.Feature = {
    geometry: parcels.reduce((acc, parcel) => union(acc, parcel)).geometry,
    properties: {},
    type: 'Feature'
  };
  return bboxByAspectRatio(bounds, map.printSize[1], map.printSize[0], border);
}

function loadGeoJSON(map): Record<ParcelID, Parcel> {
  const [state, county, town] = map.path.split(':');
  const fn = `${dist}/${state}/${county}/${town}/parcels.geojson`;
  const parcels: Parcels = JSON.parse(readFileSync(fn).toString());
  return parcels.features.reduce((acc, parcel) => {
    const id = parcel.id;
    acc[id] = parcel;
    return acc;
  }, {});
}

async function loadStolenParcels(): Promise<Record<ParcelID, Parcel>> {
  const record = {};
  const stolen = await parcels.get();
  for (const doc of stolen.docs) {
    const parcel = doc.data() as Parcel;
    deserializeParcel(parcel);
    record[parcel.id] = parcel;
  }
  return record;
}

async function main(): Promise<void> {
  for (const map of MAPS) {
    console.log(chalk.green(`... creating map ${map.id} from ${map.owner}`));

    // 👉 delete any prior map
    await maps.doc(map.id).delete();

    // 👉 calculate bbox with 100ft border
    if (map.type === 'area')
      map.bbox = bboxFromDimensions(map, 100 * 0.0003048 /* 👈 km */);
    if (map.type === 'property')
      map.bbox = await bboxFromParcelIDs(map, 100 * 0.0003048 /* 👈 km */);

    // 👉 create new one
    await maps.doc(map.id).set(map);
  }
}

main();
