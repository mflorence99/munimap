import { CulvertProperties } from "../lib/src/common";
import { Landmark } from "../lib/src/common";

import { culvertConditions } from "../lib/src/common";
import { culvertFloodHazards } from "../lib/src/common";
import { culvertHeadwalls } from "../lib/src/common";
import { culvertMaterials } from "../lib/src/common";
import { makeLandmarkID } from "../lib/src/common";
import { serializeLandmark } from "../lib/src/common";

import * as firebase from "firebase-admin/app";
import * as firestore from "firebase-admin/firestore";
import * as inquirer from "inquirer";
import * as yargs from "yargs";

import { XMLParser } from "fast-xml-parser";

import { readFileSync } from "fs";

import chalk from "chalk";

interface Curation {
  owner: string;
  path: string;
  source?: string;
}

const CURATIONS: Curation[] = [
  // ///////////////////////////////////////////////////////////////////
  // 👇 DPW culverts
  // ///////////////////////////////////////////////////////////////////
  {
    owner: "ljg@gsinet.net",
    path: "NEW HAMPSHIRE:SULLIVAN:WASHINGTON",
    source: "./bin/assets/dpw/culverts-curated.gpx"
  }
];

// 👇 https://github.com/firebase/firebase-admin-node/issues/776

const useEmulator = yargs.argv["useEmulator"];

if (useEmulator) process.env["FIRESTORE_EMULATOR_HOST"] = "localhost:8080";

// 👇 https://stackoverflow.com/questions/49691215/cloud-functions-how-to-copy-firestore-collection-to-a-new-document

firebase.initializeApp({
  credential: firebase.cert("./firebase-admin.json"),
  databaseURL: "https://washington-app-319514.firebaseio.com"
});

const db = firestore.getFirestore();
const landmarks = db.collection("landmarks");

// 👇 let's rock!

async function main(): Promise<void> {
  if (!useEmulator) {
    const response = await inquirer.prompt([
      {
        type: "input",
        name: "proceed",
        choices: ["y", "n"],
        message: "WARNING: running on live Firestore. Proceed? (y/N)"
      }
    ]);
    if (response.proceed.toLowerCase() !== "y") return;
  }

  // 👇 for each curation ...
  for (const curation of CURATIONS) {
    console.log(
      chalk.green(
        `... processing curation for ${curation.owner} in ${curation.path}`
      )
    );

    // 👇 delete all curated culverts
    let numDeleted = 0;
    const curated = await landmarks.where("owner", "==", curation.owner).get();
    for (const doc of curated.docs) {
      await doc.ref.delete();
      process.stdout.write(".");
      numDeleted += 1;
    }

    console.log(
      chalk.red(`... ${numDeleted} previously curated culverts deleted`)
    );

    // 👇 load up GPX
    const raw = readFileSync(curation.source).toString();
    const gpx = new XMLParser({ ignoreAttributes: false }).parse(raw);

    // 👇 for each culvert ...

    const promises = [];
    gpx.gpx.wpt.forEach((culvert) => {
      // 👇 split props and eliminate decoration and smart quotes
      const parts = culvert.name
        .replace(/&apos;/g, "'")
        .replace(/&quot;/g, '"')
        .trim()
        .split(/[\n ]+/);

      // 👇 model culvert
      const properties: CulvertProperties = {
        condition: culvertConditions[0],
        count: 1,
        description: culvert.desc !== "undefined" ? culvert.desc : null,
        diameter: 0,
        floodHazard: culvertFloodHazards[0],
        headwall: culvertHeadwalls[0],
        height: 0,
        length: 0,
        location: culvert.keywords,
        material: culvertMaterials[0],
        type: "culvert",
        width: 0,
        year: null
      };

      // 🔥 see import-culverts.ts
      parts.forEach((part: any) => {
        part = part.trim();
        part = `${part.substring(0, 1).toUpperCase()}${part
          .substring(1)
          .toLowerCase()}`;
        if (culvertConditions.includes(part)) properties.condition = part;
        if (/^[\d]+x$/.test(part))
          properties.count = Number(part.substring(0, part.length - 1));
        if (/^[\d]+"$/.test(part))
          properties.diameter = Number(part.substring(0, part.length - 1));
        if (/^[\d]+["']?x[\d]+["']?$/.test(part)) {
          const dims = part.replaceAll(/["']/g, "").split("x");
          properties.height = Number(dims[1]);
          properties.width = Number(dims[0]);
        }
        if (culvertFloodHazards.includes(part)) properties.floodHazard = part;
        if (culvertHeadwalls.includes(part)) properties.headwall = part;
        if (/^[\d]+'$/.test(part))
          properties.length = Number(part.substring(0, part.length - 1));
        if (culvertMaterials.includes(part)) properties.material = part;
        if (/^\d{4}$/.test(part)) properties.year = Number(part);
      });

      console.log(
        chalk.yellow(
          `...... adding curated culvert [${culvert["@_lon"]}, ${culvert["@_lat"]}] ${culvert.name} ${culvert.keywords}`
        )
      );

      // 👇 construct the new landmark
      const landmark: Landmark = {
        geometry: {
          coordinates: [culvert["@_lon"], culvert["@_lat"]],
          type: "Point"
        },
        id: null,
        owner: curation.owner,
        path: curation.path,
        properties: { metadata: properties },
        type: "Feature"
      };

      // 👇 so that they can't get duplicated
      landmark.id = makeLandmarkID(landmark);

      // 👇 write out the landmark
      serializeLandmark(landmark);
      promises.push(landmarks.doc(landmark.id).set(landmark));
    });

    console.log(
      chalk.blue(`...... waiting for ${promises.length} promises to resolve`)
    );
    await Promise.all(promises);
  }
}

main();
