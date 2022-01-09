import { simplify } from '../lib/src/geojson';
import { theState } from '../lib/src/geojson';

import { mkdirSync } from 'fs';
import { readFileSync } from 'fs';
import { writeFileSync } from 'fs';

import chalk from 'chalk';
import hash from 'object-hash';
import toGeoJSON from '@mapbox/togeojson';
import xmldom from 'xmldom';

const gpx = new xmldom.DOMParser().parseFromString(
  readFileSync('./proxy/assets/washington-buildings.gpx', 'utf8')
);

// ⚠️ this program is obsolete, as we no longer use the data
//    captured for the old washington-app

const dist = './data';

const county = 'SULLIVAN';
const town = 'WASHINGTON';

const buildings = toGeoJSON.gpx(gpx);

const geojson: GeoJSON.FeatureCollection = {
  features: [],
  type: 'FeatureCollection'
};

buildings.features.forEach((building) => {
  // 👉 convert LineStrings into Polygons
  if (building.geometry.type === 'LineString') {
    building.geometry.type = 'Polygon';
    const coords = building.geometry.coordinates;
    const last = coords.length - 1;
    if (coords[0][0] !== coords[last][0] || coords[0][1] !== coords[last][1])
      coords.push(coords[0]);
    building.geometry.coordinates = [coords];
  }
  // 👉 the original dataset doesn't have an ID for buildings
  //    so let's at least use a hash of the geometry so that
  //    every time we load the same ID is used
  building.id = hash.MD5(building.geometry);
  geojson.features.push(building);
});

// 👉 one file for Washington
console.log(
  chalk.green(`... writing ${theState}/${county}/${town}/XXXXXX.geojson`)
);
mkdirSync(`${dist}/${theState}/${county}/${town}`, { recursive: true });
writeFileSync(
  `${dist}/${theState}/${county}/${town}/XXXXXX.geojson`,
  JSON.stringify(simplify(geojson))
);
