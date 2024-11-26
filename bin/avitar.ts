import { isParcelStollen } from '../lib/src/common';

import { readFileSync } from 'fs';
import { writeFileSync } from 'fs';

import chalk from 'chalk';
import DBFParser from 'node-dbf';

// 🔥 only washington has an avitar.dbf
//    we'll have to change this a lot for others

const avitarByID: Record<string, any> = {};

const parser = new DBFParser('./bin/assets/washington-avitar.dbf');

parser.on('record', (record) => {
  let id = `${parseInt(record.MAP, 10)}-${parseInt(record.LOT, 10)}`;
  if ('000000' !== record.SUB) {
    let sub = record.SUB;
    while (sub.length > 2 && sub[0] === '0') sub = sub.slice(1);
    id = `${id}-${sub}`;
  }
  avitarByID[id] = record;
  // if (record.OWNER.startsWith("NONNO")) jsome(record);
});

parser.on('end', () => {
  console.log(chalk.blue(`DBF parse of AVITAR.DBF complete`));
  main();
});

parser.parse();

// 👇 load base geojson

const featureByID = JSON.parse(
  readFileSync('./bin/assets/washington-parcels.geojson').toString()
).features.reduce((acc, feature) => {
  acc[feature.id] = feature;
  return acc;
}, {});

// 👇 the business

function main(): void {
  try {
    eliminateStolenParcels();
    updateFromAvitar();
    searchForAnomalies();
    // jsome(avitarByID["15-70-01"]);
    // jsome(featureByID["9-7"]);
    saveGeoJSON();
  } catch (error) {
    console.log(chalk.red(error.message));
  }
}

function eliminateStolenParcels(): void {
  Object.keys(featureByID)
    .filter((id) => isParcelStollen(id))
    .forEach((id) => delete featureByID[id]);
}

function saveGeoJSON(): void {
  const geojson = {
    type: 'FeatureCollection',
    features: Object.values(featureByID)
  };
  writeFileSync(
    './bin/assets/washington-parcels.geojson',
    JSON.stringify(geojson)
  );
}

function searchForAnomalies(): void {
  // ///////////////////////////////////////////////////////////////////////
  // 👇 these lots are no longer in the Avitar database
  // ///////////////////////////////////////////////////////////////////////
  const missingFromAvitar = Object.keys(featureByID).filter(
    (id) => !avitarByID[id]
  );
  if (missingFromAvitar.length > 0) {
    console.log(
      chalk.red(`\n\n${missingFromAvitar.length} LOTS NOT FOUND IN Avitar:`)
    );
    missingFromAvitar.forEach((id) => {
      const feature = featureByID[id];
      console.log(
        `${feature.id}\t${feature.properties.address}\t${feature.properties.owner}`
      );
    });
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

function updateFromAvitar(): void {
  Object.keys(avitarByID)
    .map((id) => [avitarByID[id], featureByID[id]])
    .filter(([_, feature]) => !!feature)
    .forEach(([avitar, feature]) => {
      console.log(chalk.green(`... ${feature.id}`));
      // 👇 assessment
      feature.properties.building$ = avitar.BLDTXVAL;
      feature.properties.land$ = avitar.LNDTXVAL;
      feature.properties.other$ = avitar.FEATXVAL;
      feature.properties.taxed$ = avitar.TOTTXVAL;
      // 👇 other data
      feature.properties.addressOfOwner =
        `${avitar.ADDRESS} ${avitar.ADDRESS2} ${avitar.CITY} ${avitar.STATE} ${avitar.ZIP}`
          .replace(/\s\s+/g, ' ')
          .trim();
      feature.properties.neighborhood = avitar.NGHBRHD;
    });
}

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
