import * as firebase from "firebase-admin/app";
import * as firestore from "firebase-admin/firestore";
import * as inquirer from "inquirer";
import * as yargs from "yargs";

// 👇 https://github.com/firebase/firebase-admin-node/issues/776

const useEmulator = yargs.argv["useEmulator"];

if (useEmulator) process.env["FIRESTORE_EMULATOR_HOST"] = "localhost:8080";

// 👇 https://stackoverflow.com/questions/49691215/cloud-functions-how-to-copy-firestore-collection-to-a-new-document

firebase.initializeApp({
  credential: firebase.cert("./firebase-admin.json"),
  databaseURL: "https://washington-app-319514.firebaseio.com"
});

const batchSize = 100;

const db = firestore.getFirestore();

async function clean(nm: string, key: string): Promise<void> {
  const live = db.collection(`${nm}`);

  // 👇 remove all docs from the live collection
  let backupCursor = null;
  let numDeleted = 0;
  while (true) {
    const bite = await live
      .orderBy(key)
      .startAfter(backupCursor)
      .limit(batchSize)
      .get();
    if (bite.empty) break;
    const batch = db.batch();
    for (const doc of bite.docs) {
      backupCursor = doc.data()[key];
      batch.delete(doc.ref);
      process.stdout.write(".");
      numDeleted += 1;
    }
    await batch.commit();
  }
  console.log(`${numDeleted} deleted from ${nm}`);
}

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

  // await clean('landmarks', 'id');
  // await clean('maps', 'id');
  await clean("parcels", "id");
  // await clean('profiles', 'email');
}

main();
