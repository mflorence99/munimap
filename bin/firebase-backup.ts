import * as firebase from 'firebase-admin/app';
import * as firestore from 'firebase-admin/firestore';

// 👇 https://github.com/firebase/firebase-admin-node/issues/776

const useEmulator = false;

if (useEmulator) process.env['FIRESTORE_EMULATOR_HOST'] = 'localhost:8080';

// 👇 https://stackoverflow.com/questions/49691215/cloud-functions-how-to-copy-firestore-collection-to-a-new-document

firebase.initializeApp({
  credential: firebase.cert('./firebase-admin.json'),
  databaseURL: 'https://washington-app-319514.firebaseio.com'
});

const db = firestore.getFirestore();

async function main(): Promise<void> {
  const backup = db.collection('parcels-backup');
  const parcels = db.collection('parcels');

  const query = parcels
    .where('owner', 'in', [
      'mflo999@gmail.com',
      'kchidester@washingtonnh.org',
      'nick@mnassessing.com'
    ])
    .where('path', '==', 'NEW HAMPSHIRE:SULLIVAN:WASHINGTON');

  const snapshot = await query.get();
  let numCopied = 0;
  for (const doc of snapshot.docs) {
    await backup.add(doc.data());
    process.stdout.write('.');
    numCopied += 1;
  }

  console.log(`${numCopied} docs backed up`);
}

main();
