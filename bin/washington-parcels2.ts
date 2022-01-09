import { simplify } from '../lib/src/geojson';
import { theState } from '../lib/src/geojson';

import { mkdirSync } from 'fs';
import { readFileSync } from 'fs';
import { writeFileSync } from 'fs';

import chalk from 'chalk';

// 👉 Washington is special as we have already curated the parcels

const dist = './data';

const county = 'SULLIVAN';
const town = 'WASHINGTON';

const geojson = JSON.parse(
  readFileSync('./proxy/assets/washington-parcels.geojson').toString()
);

console.log(chalk.green(`... writing ${theState}/parcels.geojson`));

console.log(
  chalk.green(`... writing ${theState}/${county}/${town}/parcels.geojson`)
);
mkdirSync(`${dist}/${theState}/${county}/${town}`, { recursive: true });
writeFileSync(
  `${dist}/${theState}/${county}/${town}/parcels.geojson`,
  JSON.stringify(simplify(geojson))
);

// 👉 the idea behind searchables is to provide just enough data for
//    parcels to be searched -- we do this because we MUST have ALL
//    the data available

console.log(
  chalk.green(`... writing ${theState}/${county}/${town}/searchables.geojson`)
);
mkdirSync(`${dist}/${theState}/${county}/${town}`, { recursive: true });

// 👉 now do this again, converting the real parcels into searchables
const searchables: GeoJSON.FeatureCollection = {
  features: geojson.map((feature: any): any => ({
    bbox: feature.bbox,
    id: feature.id,
    properties: {
      address: feature.properties.address,
      id: feature.properties.id,
      owner: feature.properties.owner
    },
    type: 'Feature'
  })),
  type: 'FeatureCollection'
};
writeFileSync(
  `${dist}/${theState}/${county}/${town}/searchables.geojson`,
  JSON.stringify(simplify(searchables))
);

// 👉 the idea behind countables is to provide just enough data for
//    parcels to be aggregated -- we do this because we MUST have ALL
//    the data available

console.log(
  chalk.green(`... writing ${theState}/${county}/${town}/countables.geojson`)
);
mkdirSync(`${dist}/${theState}/${county}/${town}`, { recursive: true });

// 👉 now do this again, converting the real parcels into countables
const countables: GeoJSON.FeatureCollection = {
  features: geojson.map((feature: any): any => ({
    id: feature.id,
    properties: {
      area: feature.properties.area,
      usage: feature.properties.usage,
      use: feature.properties.use
    },
    type: 'Feature'
  })),
  type: 'FeatureCollection'
};
writeFileSync(
  `${dist}/${theState}/${county}/${town}/countables.geojson`,
  JSON.stringify(simplify(countables))
);
