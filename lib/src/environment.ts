import BUILD from '../assets/build.json';
import PACKAGE from '../../package.json';

import { UAParser } from 'ua-parser-js';

import { firebase } from 'firebaseui-angular';
import { firebaseui } from 'firebaseui-angular';

const isDev = ['localhost', '127.0.0.1'].includes(location.hostname);

export const environment = {
  auth: {
    credentialHelper: firebaseui.auth.CredentialHelper.NONE,
    signInFlow: 'popup',
    signInOptions: [
      // TODO 🔥 properly configure these in Firebase
      firebase.auth.GoogleAuthProvider.PROVIDER_ID,
      firebase.auth.FacebookAuthProvider.PROVIDER_ID,
      firebase.auth.TwitterAuthProvider.PROVIDER_ID,
      {
        requireDisplayName: true,
        provider: firebase.auth.EmailAuthProvider.PROVIDER_ID
      }
    ]
  },

  build: {
    id: BUILD.id,
    date: BUILD.date
  },

  endpoints: {
    proxy: isDev
      ? 'http://localhost:4201'
      : /* 🔥  */ 'https://proxy.munimap.online'
  },

  firebase: {
    apiKey: 'AIzaSyAKCbc2W6oaaSuRqMgHneFAy3eoRmmwHZI',
    authDomain: 'washington-app-319514.firebaseapp.com',
    projectId: 'washington-app-319514',
    storageBucket: 'washington-app-319514.appspot.com',
    messagingSenderId: '943285729018',
    appId: '1:943285729018:web:7d01b14f96a3d0c8497b43',
    measurementId: 'G-NZNZ5E4EV7'
  },

  mapbox: {
    // 👇 don't panic! domain protected
    apiKey:
      'sk.eyJ1IjoibWZsbzk5OSIsImEiOiJja3VmbGFrZmUxdmxhMnFxcDc0YzFoMHB4In0.nzf2uxMbBt5J2KVvjIRbnA'
  },

  package: {
    author: PACKAGE.author,
    name: PACKAGE.name,
    description: PACKAGE.description,
    license: PACKAGE.license,
    repository: {
      type: PACKAGE.repository.type,
      url: PACKAGE.repository.url
    },
    version: PACKAGE.version
  },

  production: !isDev,

  ua: UAParser(),

  version: {
    allowReloadPostponement: isDev,
    autoReload: !isDev,
    checkVersionAfter: 20 * 1000,
    checkVersionInterval: isDev ? 60 * 1000 : 60 * 60 * 1000
  }
};
