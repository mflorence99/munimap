import * as fireauth from 'firebase-admin/auth';
import * as firebase from 'firebase-admin/app';
import * as firestore from 'firebase-admin/firestore';
import * as inquirer from 'inquirer';
import * as yargs from 'yargs';

const PROFILES = [
  {
    email: 'mflo999@gmail.com',
    workgroup: 'nick@mnassessing.com kchidester@washingtonnh.org'
  },
  {
    email: 'mflo999+dpw@gmail.com',
    workgroup: 'ethayer@washingtonnh.org'
  },
  {
    email: 'mflo999+flo@gmail.com',
    workgroup: 'mflo999@gmail.com'
  },
  {
    email: 'cmoskey@gmail.com'
  },
  {
    email: 'marshal@gsinet.net'
  },
  {
    email: 'ethayer@washingtonnh.org',
    workgroup: 'mflo999+dpw@gmail.com'
  }
];

const USERS = [
  {
    email: 'mflo999@gmail.com',
    password: '33Buster44@@',
    displayName: 'Mark Florence'
  },
  {
    email: 'mflo999+dpw@gmail.com',
    password: '33Buster44@@',
    displayName: 'Mark Florence'
  },
  {
    email: 'mflo999+flo@gmail.com',
    password: 'password',
    displayName: 'Marco Polo'
  },
  {
    email: 'cmoskey@gmail.com',
    password: 'password',
    displayName: 'Carl Moskey'
  },
  {
    email: 'ethayer@washingtonnh.org',
    password: 'password',
    displayName: 'Ed Thayer'
  },
  {
    email: 'marshal@gsinet.net',
    password: 'password',
    displayName: 'Tom Marshall'
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
