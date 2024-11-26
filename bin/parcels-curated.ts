import { Parcels } from '../lib/src/common';

import { normalizeParcel } from '../lib/src/common';
import { simplify } from '../lib/src/common';
import { theState } from '../lib/src/common';

import { GeoJSON } from 'geojson';

import { mkdirSync } from 'fs';
import { readFileSync } from 'fs';
import { writeFileSync } from 'fs';

import chalk from 'chalk';

const loadem = (fn): Parcels => JSON.parse(readFileSync(fn).toString());

// 👇 some towns have curated parcels

const curated = {
  MERRIMACK: {
    HENNIKER: loadem('./bin/assets/henniker-parcels.geojson')
  },
  SULLIVAN: {
    WASHINGTON: loadem('./bin/assets/washington-parcels.geojson')
  }
};

const dist = './data';

// 👇 for each curated county, town

Object.keys(curated).forEach((county) => {
  Object.keys(curated[county]).forEach((town) => {
    const geojson = curated[county][town];

    // 👇 we need to do this to account for derived fields
    geojson.features.forEach((feature: any): void => {
      normalizeParcel(feature);
    });

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
      chalk.green(
        `... writing ${theState}/${county}/${town}/searchables.geojson`
      )
    );
    mkdirSync(`${dist}/${theState}/${county}/${town}`, { recursive: true });

    // 👉 now do this again, converting the real parcels into searchables
    const searchables: GeoJSON.FeatureCollection = {
      features: geojson.features.map((feature: any): any => ({
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
      JSON.stringify(searchables)
    );

    // 👉 the idea behind countables is to provide just enough data for
    //    parcels to be aggregated -- we do this because we MUST have ALL
    //    the data available

    console.log(
      chalk.green(
        `... writing ${theState}/${county}/${town}/countables.geojson`
      )
    );
    mkdirSync(`${dist}/${theState}/${county}/${town}`, { recursive: true });

    // 👉 now do this again, converting the real parcels into countables
    const countables: GeoJSON.FeatureCollection = {
      features: geojson.features.map((feature: any): any => ({
        id: feature.id,
        properties: {
          area: feature.properties.area,
          ownership: feature.properties.ownership,
          usage: feature.properties.usage,
          use: feature.properties.use
        },
        type: 'Feature'
      })),
      type: 'FeatureCollection'
    };
    writeFileSync(
      `${dist}/${theState}/${county}/${town}/countables.geojson`,
      JSON.stringify(countables)
    );
  });
});
