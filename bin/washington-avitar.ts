import { readFileSync } from 'fs';
import { writeFileSync } from 'fs';

import chalk from 'chalk';
import DBFParser from 'node-dbf';

// 👇 process the avitar database

const avitarByID: Record<string, any> = {};

const parser = new DBFParser('./proxy/assets/washington-avitar.dbf');

parser.on('record', (record) => {
  let id = `${parseInt(record.MAP, 10)}-${parseInt(record.LOT, 10)}`;
  if ('000000' !== record.SUB) {
    let sub = record.SUB;
    while (sub.length > 2 && sub[0] === '0') sub = sub.slice(1);
    id = `${id}-${sub}`;
  }
  avitarByID[id] = record;
});

parser.on('end', () => {
  console.log(chalk.blue(`DBF parse of AVITAR.DBF complete`));
  main();
});

parser.parse();

// 👇 load base geojson

const geojson = JSON.parse(
  readFileSync('./proxy/assets/washington-parcels.geojson').toString()
);

const featureByID = geojson.features.reduce((acc, feature) => {
  acc[feature.id] = feature;
  return acc;
}, {});

// 👇 the business

function main(): void {
  try {
    searchForAnomalies();
    checkForOwnershipChanges();
    saveGeoJSON();
  } catch (error) {
    console.log(chalk.red(error.message));
  }
}

function checkForOwnershipChanges(): void {
  console.log(chalk.yellow('\n\nOwnership changes:'));
  Object.keys(avitarByID).forEach((id) => {
    const alot = avitarByID[id];
    const plot = featureByID[id];
    if (plot && alot.OWNER !== plot.properties.owner) {
      console.log(
        `${chalk.cyan(id)} owner changed to "${chalk.blue(
          alot.OWNER
        )}" from "${chalk.green(plot.properties.owner)}"`
      );
      plot.properties.owner = alot.OWNER;
    }
  });
}

function saveGeoJSON(): void {
  writeFileSync(
    './proxy/assets/washington-parcels.geojson',
    JSON.stringify(geojson)
  );
}

function searchForAnomalies(): void {
  // ///////////////////////////////////////////////////////////////////////
  // 👇 these lots are no longer in the Avitar database
  // ///////////////////////////////////////////////////////////////////////
  const missingFromAvitar = geojson.features.filter(
    (feature) => !avitarByID[feature.id]
  );
  if (missingFromAvitar.length > 0) {
    console.log(
      chalk.red(`\n\n${missingFromAvitar.length} LOTS NOT FOUND IN Avitar:`)
    );
    missingFromAvitar.forEach((feature) =>
      console.log(
        `${feature.id}\t${feature.properties.address}\t${feature.properties.owner}`
      )
    );
  }
  // ///////////////////////////////////////////////////////////////////////
  // 👇 these lots are in Avitar but new to us
  // ///////////////////////////////////////////////////////////////////////
  const missingFromData = Object.keys(avitarByID).filter(
    (id) => !featureByID[id] && Number(avitarByID[id].area) > 0
  );
  if (missingFromData.length > 0) {
    console.log(
      chalk.red(
        `\n\n${missingFromData.length} LOTS NOT FOUND IN parcel-data.ts:`
      )
    );
    missingFromData.forEach((id) => {
      const assessors = avitarByID[id];
      console.log(`${id}\t${assessors.ADDRESS}\t${assessors.OWNER}`);
    });
  }
}

/* eslint-disable @typescript-eslint/naming-convention */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const sample = {
  PID: '000000000001000000',
  MAP: '000000',
  LOT: '000001',
  SUB: '000000',
  CARDS: 1,
  LOCNUMB: '',
  LOCNAME: 'AP UTILITY PROPERTY',
  OWNER: 'NH ELECTRIC COOP',
  COOWNER: '',
  ADDRESS: '579 TENNEY MT HWY',
  ADDRESS2: '',
  CITY: 'PLYMOUTH',
  STATE: 'NH',
  ZIP: '03264',
  ZIP4: '3147',
  ACRES: 0,
  LANDUSE: 'UTILITY-ELEC',
  ZONE: 'RESIDENTIAL',
  MODEL: '',
  BEDRMS: 0,
  BTHRMS: 0,
  YRBUILT: 0,
  SALEDATE: '',
  SALEBK: '',
  SALEPG: '',
  SALEGRNT: '',
  LNDMKVAL: 0,
  CUSECRED: 0,
  CURRENTUSE: 'N',
  LNDTXVAL: 0,
  BLDTXVAL: 0,
  FEATXVAL: 866700,
  TOTTXVAL: 866700,
  FN: 0,
  SALEPRICE: null,
  SALEQUAL: '',
  SALEIMPR: '',
  AREA: 0,
  CARDTOTAL: 866700,
  CARDTOTALO: 0,
  BLDGGRADE: '',
  BLDGSTORIE: '',
  BLDGCONDIT: '',
  NGHBRHD: 'N-E',
  NGHBRHDDES: 'AVG',
  BLDGDEPREC: 0,
  BLDGADJBAS: 0,
  XSFRONTAGE: 0,
  WATERFRONT: 0,
  VIEWFACTOR: 'N',
  PRIORLNDTX: 0,
  PRIORBLDTX: 0,
  PRIORFEATX: 0,
  PRIORTOTTX: 0,
  TOWNNAME: 'WASHINGTON',
  PARCELNOTE: ''
};