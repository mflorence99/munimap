import * as firebase from 'firebase-admin/app';
import * as firestore from 'firebase-admin/firestore';
import * as process from 'node:process';

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

const batchSize = 100;

const db = firestore.getFirestore();

async function restore(nm: string, key: string): Promise<void> {
  const backup = db.collection(`${nm}-backup`);
  const live = db.collection(`${nm}`);

  // 👇 remove all docs from the live collection
  let liveCursor = null;
  let numDeleted = 0;
  while (true) {
    const bite = await live
      .orderBy(key)
      .startAfter(liveCursor)
      .limit(batchSize)
      .get();
    if (bite.empty) break;
    const batch = db.batch();
    for (const doc of bite.docs) {
      liveCursor = doc.data()[key];
      batch.delete(doc.ref);
      process.stdout.write('.');
      numDeleted += 1;
    }
    await batch.commit();
  }
  console.log(`${numDeleted} deleted from ${nm}`);

  // 👇 copy all docs from the backup collection to the live collection
  let backupCursor = null;
  let numCopied = 0;
  while (true) {
    const bite = await backup
      .orderBy(key)
      .startAfter(backupCursor)
      .limit(batchSize)
      .get();
    if (bite.empty) break;
    const batch = db.batch();
    for (const doc of bite.docs) {
      backupCursor = doc.data()[key];
      batch.set(live.doc(doc.id), doc.data());
      process.stdout.write('.');
      numCopied += 1;
    }
    await batch.commit();
  }
  console.log(`${numCopied} ${nm}-backup restored`);
}

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

  // await restore('landmarks', 'id');
  // await restore('maps', 'id');
  await restore('parcels', 'id');
  // await restore('profiles', 'email');
}

main();
