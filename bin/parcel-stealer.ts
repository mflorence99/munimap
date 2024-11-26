import { Parcel } from '../lib/src/common';
import { Parcels } from '../lib/src/common';

import { calculateParcel } from '../lib/src/common';
import { normalizeParcel } from '../lib/src/common';
import { serializeParcel } from '../lib/src/common';

import * as firebase from 'firebase-admin/app';
import * as firestore from 'firebase-admin/firestore';
import * as inquirer from 'inquirer';
import * as yargs from 'yargs';

import { readFileSync } from 'fs';

import chalk from 'chalk';

const dist = './data';

interface StolenParcel {
  geometry?: any;
  parcelID: string;
}

interface Steal {
  fromPath: string;
  owner: string;
  stolen: StolenParcel[];
  toPath: string;
  uid: number;
}

const STEALS: Steal[] = [
  {
    fromPath: 'NEW HAMPSHIRE:MERRIMACK:BRADFORD',
    owner: 'mflo999@gmail.com',
    stolen: [
      {
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [-72.02144540842676, 43.209150876779745],
              [-72.02213573978757, 43.208084974542885],
              [-72.02344373605018, 43.20548965642678],
              [-72.02404034015244, 43.204158371546924],
              [-72.02718756150263, 43.20774966506883],
              [-72.02785631063652, 43.208512961621295],
              [-72.02844266120816, 43.209141200030984],
              [-72.02144540842676, 43.209150876779745]
            ]
          ]
        },
        parcelID: '12-4'
      }
    ],
    toPath: 'NEW HAMPSHIRE:SULLIVAN:WASHINGTON',
    uid: 1
  },
  {
    fromPath: 'NEW HAMPSHIRE:HILLSBOROUGH:DEERING',
    owner: 'mflo999@gmail.com',
    stolen: [
      {
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [-71.80956883291732, 43.12370311524194],
              [-71.81098, 43.123909999999995],
              [-71.81124, 43.12388999999999],
              [-71.81163, 43.123819999999995],
              [-71.81264, 43.12378000000004],
              [-71.81179, 43.12395000000001],
              [-71.80966, 43.124300000000005],
              [-71.80956883291732, 43.12370311524194]
            ]
          ]
        },
        parcelID: '202-6'
      }
    ],
    toPath: 'NEW HAMPSHIRE:MERRIMACK:HENNIKER',
    uid: 2
  },
  {
    fromPath: 'NEW HAMPSHIRE:HILLSBOROUGH:WEARE',
    owner: 'mflo999@gmail.com',
    stolen: [
      {
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [-71.80501, 43.12517999999997],
              [-71.80487, 43.12468999999999],
              [-71.80484, 43.12447],
              [-71.80454, 43.12389999999999],
              [-71.80529, 43.12304],
              [-71.80553, 43.12303000000003],
              [-71.80578, 43.12302],
              [-71.80602, 43.12303000000003],
              [-71.80627, 43.12304],
              [-71.80652, 43.12306000000004],
              [-71.80676, 43.123080000000044],
              [-71.80692, 43.12311],
              [-71.80708, 43.12315000000001],
              [-71.80723, 43.1232],
              [-71.80738, 43.123249999999985],
              [-71.80753, 43.12330000000003],
              [-71.80768, 43.12335999999999],
              [-71.80782, 43.12342000000001],
              [-71.80796, 43.123490000000004],
              [-71.80803, 43.123549999999966],
              [-71.80811, 43.12359999999998],
              [-71.8082, 43.12365],
              [-71.80829, 43.12369000000001],
              [-71.80839, 43.12371999999999],
              [-71.80849, 43.12375000000003],
              [-71.8086, 43.12377000000001],
              [-71.8087, 43.123789999999985],
              [-71.80881, 43.12380000000002],
              [-71.80892, 43.12380000000002],
              [-71.80902, 43.12380000000002],
              [-71.80911, 43.123789999999985],
              [-71.80956883291732, 43.12370311524194],
              [-71.80978, 43.12517],
              [-71.80533553036386, 43.12596127324829],
              [-71.80501, 43.12517999999997]
            ]
          ]
        },
        parcelID: '401-36'
      }
    ],
    toPath: 'NEW HAMPSHIRE:MERRIMACK:HENNIKER',
    uid: 3
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
const parcels = db.collection('parcels');

function loadGeoJSON(path: string): Parcels {
  const [state, county, town] = path.split(':');
  const fn = `${dist}/${state}/${county}/${town}/parcels.geojson`;
  return JSON.parse(readFileSync(fn).toString());
}

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

  for (const steal of STEALS) {
    const [, county, town] = steal.toPath.split(':');

    console.log(
      chalk.green(
        `... processing steal for ${steal.owner} from ${steal.fromPath}`
      )
    );

    // 👉 load up the "from" parcels
    const geojson = loadGeoJSON(steal.fromPath);

    // 👉 for each parcel feature ...
    const promises = [];
    for (const stolen of steal.stolen) {
      console.log(chalk.yellow(`...... stealing parcel ${stolen.parcelID}`));

      // 👉 delete any prior steal
      const docID = `STEAL #${steal.uid} (${stolen.parcelID})`;
      await parcels.doc(docID).delete();

      // 👉 steal the parcel from the "from" path
      const feature = geojson.features.find(
        (feature) => feature.id === stolen.parcelID
      );

      // 👉 construct the new parcel
      const parcel: Parcel = {
        action: 'added',
        geometry: stolen.geometry ?? feature.geometry,
        id: `(${stolen.parcelID})`,
        owner: steal.owner,
        path: steal.toPath,
        properties: {
          address: feature.properties.address ?? 'UNKNOWN',
          area: feature.properties.area ?? 0,
          county: county,
          id: `(${stolen.parcelID})`,
          neighborhood: '',
          owner: feature.properties.owner ?? 'UNKNOWN',
          town: town,
          usage: feature.properties.usage ?? '110',
          use: feature.properties.use ?? '',
          zone: ''
        },
        type: 'Feature'
      };

      // 👉 normalize the parcel
      calculateParcel(parcel);
      normalizeParcel(parcel);
      serializeParcel(parcel);
      // 👁️ https://titanwolf.org/Network/Articles/Article?AID=c2f8e1f8-31d8-4b5a-9a73-1c50f7614057
      parcel.timestamp = firestore.FieldValue.serverTimestamp();

      promises.push(parcels.doc(docID).set(parcel));
    }

    await Promise.all(promises);
    console.log(
      chalk.blue(`...... waiting for ${promises.length} promises to resolve`)
    );
  }
}

main();
