import { PARCELS } from '../proxy/assets/washington-parcels';

import * as turf from '@turf/turf';

import { mkdirSync } from 'fs';
import { writeFileSync } from 'fs';

import chalk from 'chalk';

// 👉 Washington is special as we have already curated the lots

const dist = './dist/proxy';

const state = 'NEW HAMPSHIRE';
const county = 'SULLIVAN';
const town = 'WASHINGTON';

const allLots: GeoJSON.Feature[] = [];

const fromLatLon = (l): [number, number] => (l ? [l.lon, l.lat] : null);

PARCELS.lots.forEach((lot) => {
  console.log(chalk.blue(`Processing lot ${lot.id}...`));
  const isMulti = lot.boundaries.length > 1;
  const coordinates = isMulti
    ? lot.boundaries.map((boundary) => [
        boundary.map((point) => fromLatLon(point))
      ])
    : [lot.boundaries[0].map((point) => fromLatLon(point))];
  const feature: GeoJSON.Feature<any> = {
    geometry: {
      coordinates: coordinates,
      type: isMulti ? 'MultiPolygon' : 'Polygon'
    },
    id: lot.id,
    properties: {
      abutters: lot.abutters,
      address: lot.address,
      area: lot.area,
      areas: lot.areas,
      building$: lot.building$,
      callouts: lot.callouts.map((callout) => fromLatLon(callout)),
      centers: lot.centers.map((center) => fromLatLon(center)),
      county: county,
      elevations: lot.elevations,
      id: lot.id,
      labels: lot.labels,
      land$: lot.land$,
      lengths: lot.lengths,
      minWidths: lot.minWidths,
      neighborhood: lot.neighborhood,
      orientations: lot.orientations,
      other$: lot.cu$,
      owner: lot.owner,
      perimeters: lot.perimeters,
      sqarcities: lot.sqarcities,
      taxed$: lot.taxed$,
      town: town,
      usage: lot.usage,
      use: lot.use,
      zone: lot.zone
    },
    type: 'Feature'
  };
  // 👉 we can get turf to do this once we've built the feature
  feature.bbox = turf.bbox(feature);
  allLots.push(feature);
});

// 👉 one file for Washington
console.log(
  chalk.green(`... writing ${state}/${county}/${town}/parcels.geojson`)
);
const geojson: GeoJSON.FeatureCollection = {
  features: allLots,
  type: 'FeatureCollection'
};
mkdirSync(`${dist}/${state}/${county}/${town}`, { recursive: true });
writeFileSync(
  `${dist}/${state}/${county}/${town}/parcels.geojson`,
  JSON.stringify(geojson, null, 2)
);

// 👉 the idea behind searchables is to provide just enough data for
//    parcels to be searched -- we do this because we MUST have ALL
//    the data available

console.log(
  chalk.green(`... writing ${state}/${county}/${town}/searchables.geojson`)
);
mkdirSync(`${dist}/${state}/${county}/${town}`, { recursive: true });

// 👉 now do this again, converting the real parcels into searchables
geojson.features = allLots.map((feature: any): any => ({
  bbox: feature.bbox,
  id: feature.id,
  properties: {
    address: feature.properties.address,
    id: feature.properties.id,
    owner: feature.properties.owner
  },
  type: 'Feature'
}));
writeFileSync(
  `${dist}/${state}/${county}/${town}/searchables.geojson`,
  JSON.stringify(geojson, null, 2)
);

// 👉 the idea behind countables is to provide just enough data for
//    parcels to be aggregated -- we do this because we MUST have ALL
//    the data available

console.log(
  chalk.green(`... writing ${state}/${county}/${town}/countables.geojson`)
);
mkdirSync(`${dist}/${state}/${county}/${town}`, { recursive: true });

// 👉 now do this again, converting the real parcels into countables
geojson.features = allLots.map((feature: any): any => ({
  id: feature.id,
  properties: {
    area: feature.properties.area,
    usage: feature.properties.usage,
    use: feature.properties.use
  },
  type: 'Feature'
}));
writeFileSync(
  `${dist}/${state}/${county}/${town}/countables.geojson`,
  JSON.stringify(geojson, null, 2)
);
