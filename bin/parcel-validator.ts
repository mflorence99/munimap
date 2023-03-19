import { readFileSync } from 'fs';

import chalk from 'chalk';

type FeatureCollection = GeoJSON.FeatureCollection<any, any>;

// ////////////////////////////////////////////////////////////////////
// 👇 helpers
// ////////////////////////////////////////////////////////////////////

const loadem = (fn: string): FeatureCollection => {
  console.log(chalk.blue(`reading ${fn}`));
  return JSON.parse(readFileSync(fn).toString());
};

// ////////////////////////////////////////////////////////////////////
// 👇 validate the parcels
// ////////////////////////////////////////////////////////////////////

const allParcels = loadem('./proxy/assets/washington-parcels.geojson');

allParcels.features
  .filter((parcel) => parcel.geometry.type === 'MultiPolygon')
  .forEach((multi) => {
    console.log(`${multi.id} ... ${multi.geometry.coordinates[0].length}`);
  });
