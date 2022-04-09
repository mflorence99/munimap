import * as fireauth from 'firebase-admin/auth';
import * as firebase from 'firebase-admin/app';
import * as firestore from 'firebase-admin/firestore';
import * as yargs from 'yargs';

const PROFILES = [
  {
    email: 'mflo999+flo@gmail.com',
    workgroup: 'mflo999@gmail.com'
  },
  {
    email: 'cmoskey@gmail.com',
    workgroup: 'mflo999@gmail.com'
  }
];

const USERS = [
  {
    email: 'mflo999@gmail.com',
    password: '33Spike44@@',
    displayName: 'Mark Florence'
  },
  {
    email: 'cmoskey@gmail.com',
    password: 'password',
    displayName: 'Carl Moskey'
  },
  {
    email: 'mflo999+flo@gmail.com',
    password: '33Spike44@@',
    displayName: 'Marco Polo'
  }
];

// 👇 https://github.com/firebase/firebase-admin-node/issues/776

const useEmulator = yargs.argv['useEmulator'];

if (useEmulator) {
  process.env['FIREBASE_AUTH_EMULATOR_HOST'] = 'localhost:9099';
  process.env['FIRESTORE_EMULATOR_HOST'] = 'localhost:8080';
}

// 👇 https://stackoverflow.com/questions/49691215/cloud-functions-how-to-copy-firestore-collection-to-a-new-document

firebase.initializeApp({
  credential: firebase.cert('./firebase-admin.json'),
  databaseURL: 'https://washington-app-319514.firebaseio.com'
});

const db = firestore.getFirestore();
const profiles = db.collection('profiles');

const auth = fireauth.getAuth();

async function main(): Promise<void> {
  for (const user of USERS) {
    auth
      .createUser(user)
      .then(() => console.log(`User ${user.email} created`))
      .catch((error) => console.error(`User ${user.email} ${error.message}`));
  }

  for (const profile of PROFILES) {
    await profiles.doc(profile.email).delete();
    await profiles.doc(profile.email).set(profile);
  }
}

main();
