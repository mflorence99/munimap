import * as firebase from 'firebase-admin/app';
import * as firestore from 'firebase-admin/firestore';

import { input } from '@inquirer/prompts';
import { parseArgs } from '@std/cli/parse-args';

// 👇 https://github.com/firebase/firebase-admin-node/issues/776

const useEmulator = parseArgs(Deno.args)['useEmulator'];

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
    const response = await input({
      default: 'n',
      message: 'WARNING: running on live Firestore. Proceed? (y/N)',
      transformer: (choice) => choice.toLowerCase(),
      validate: (choice) => ['y', 'n'].includes(choice)
    });
    if (response.toLowerCase() !== 'y') return;
  }

  // 👇 read all Landmarks
  const culverts = await landmarks.where('owner', '==', 'ljg@gsinet.net').get();
  for (const doc of culverts.docs) {
    const data = doc.data();
    const geometry = JSON.parse(data.geometry);
    // console.log(geometry.coordinates);

    // 🔥 King St
    //    [-72.12808734569496, 43.140036341487274]
    if (
      Number(geometry.coordinates[0]) === -72.27246 &&
      Number(geometry.coordinates[1]) === 43.2034
    ) {
      console.log(doc.data());
    }

    // 🔥 Millen Pond
    //    [-72.116, 43.174]
    if (
      Number(geometry.coordinates[0]) === -71.82285 &&
      Number(geometry.coordinates[1]) === 43.187008
    ) {
      console.log(doc.data());
    }
  }
}

main();
