import PACKAGE from "../../package.json";
import BUILD from "../assets/build.json";

import { UAParser } from "ua-parser-js";

const isDev = ["localhost", "127.0.0.1"].includes(location.hostname);

export const environment = {
  build: {
    id: BUILD.id,
    date: BUILD.date,
  },

  endpoints: {
    proxy: isDev ? "http://localhost:4201" : "https://proxy.munimap.online",
  },

  firebase: {
    // 👇 don't panic! domain protected
    apiKey: "AIzaSyAKCbc2W6oaaSuRqMgHneFAy3eoRmmwHZI",
    authDomain: "washington-app-319514.firebaseapp.com",
    projectId: "washington-app-319514",
    storageBucket: "washington-app-319514.appspot.com",
    messagingSenderId: "943285729018",
    appId: "1:943285729018:web:7d01b14f96a3d0c8497b43",
    measurementId: "G-NZNZ5E4EV7",
  },

  google: {
    // 👇 don't panic! domain protected
    apiKey: "AIzaSyCAYavpwIUZOayj72XA3AZYJeYjlVscqvk",
  },

  mapbox: {
    // 👇 don't panic! domain protected
    apiKey:
      "sk.eyJ1IjoibWZsbzk5OSIsImEiOiJja3VmbGFrZmUxdmxhMnFxcDc0YzFoMHB4In0.nzf2uxMbBt5J2KVvjIRbnA",
  },

  maptiler: {
    // 👇 don't panic! domain protected
    apiKey: "S6FkuJie61kmHmarJE1V",
  },

  package: {
    author: PACKAGE.author,
    name: PACKAGE.name,
    description: PACKAGE.description,
    license: PACKAGE.license,
    repository: {
      type: PACKAGE.repository.type,
      url: PACKAGE.repository.url,
    },
    version: PACKAGE.version,
  },

  production: !isDev,

  ua: UAParser(),

  version: {
    allowReloadPostponement: isDev,
    autoReload: !isDev,
    checkVersionAfter: 30 * 1000 /* 👈 30 seconds */,
    checkVersionInterval: isDev
      ? 30 * 1000 /* 👈 30 seconds */
      : 60 * 60 * 1000 /* 👈 1 hour */,
  },
};
