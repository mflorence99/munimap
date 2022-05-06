import * as firebase from 'firebase-admin/app';
import * as firestore from 'firebase-admin/firestore';
import * as inquirer from 'inquirer';
import * as yargs from 'yargs';

// 👇 https://github.com/firebase/firebase-admin-node/issues/776

const useEmulator = yargs.argv['useEmulator'];

if (useEmulator) process.env['FIRESTORE_EMULATOR_HOST'] = 'localhost:8080';

// 👇 https://stackoverflow.com/questions/49691215/cloud-functions-how-to-copy-firestore-collection-to-a-new-document

firebase.initializeApp({
  credential: firebase.cert('./firebase-admin.json'),
  databaseURL: 'https://washington-app-319514.firebaseio.com'
});

const db = firestore.getFirestore();

async function backup(nm: string): Promise<void> {
  const backup = db.collection(`${nm}-backup`);
  const docs = db.collection(`${nm}`);

  // 👇 remove all docs from the backup collection
  const target = await backup.get();
  let numDeleted = 0;
  for (const doc of target.docs) {
    await doc.ref.delete();
    process.stdout.write('.');
    numDeleted += 1;
  }
  console.log(`${numDeleted} deleted from ${nm}-backup`);

  // 👇 copy all docs from the source collection to the backup collection
  const source = await docs.get();
  let numCopied = 0;
  for (const doc of source.docs) {
    await backup.doc(doc.id).set(doc.data());
    process.stdout.write('.');
    numCopied += 1;
  }
  console.log(`${numCopied} ${nm} backed up`);
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

  await backup('landmarks');
  await backup('maps');
  await backup('parcels');
  await backup('profiles');
}

main();
