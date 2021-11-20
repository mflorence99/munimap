import { theState } from '../lib/src/geojson';

import { Index } from '@lib/geojson';
import { Layer } from '@lib/geojson';

import { existsSync } from 'fs';
import { readFileSync } from 'fs';
import { writeFileSync } from 'fs';

import chalk from 'chalk';

const towns = JSON.parse(
  readFileSync(
    './proxy/assets/New_Hampshire_Political_Boundaries.geojson'
  ).toString()
);

const dist = './dist/proxy';

function available({ name, url }): Layer {
  return {
    available: existsSync(`${dist}${url}`),
    name,
    url
  };
}

const index: Index = {
  [theState]: {
    layers: {
      boundary: available({
        name: 'New Hampshire State Boundary',
        url: `/${theState}/boundary.geojson`
      }),
      counties: available({
        name: 'New Hampshire County Boundaries',
        url: `/${theState}/counties.geojson`
      }),
      railroads: available({
        name: 'New Hampshire Railroads',
        url: `/${theState}/railroads.geojson`
      }),
      selectables: available({
        name: 'New Hampshire County Boundaries',
        url: `/${theState}/counties.geojson`
      }),
      towns: available({
        name: 'New Hampshire Town Boundaries',
        url: `/${theState}/towns.geojson`
      })
    }
  }
};

towns.features.forEach((feature: GeoJSON.Feature) => {
  const county = (
    feature.properties.PB_TOWN_Census_2010_StatsCOUNTYNAME as string
  ).toUpperCase();

  const town = (feature.properties.pbpNAME as string).toUpperCase();

  console.log(chalk.green(`... indexing ${theState}/${county}/${town}`));

  if (!index[theState][county]) {
    index[theState][county] = {
      layers: {
        boundary: available({
          name: `${county} Boundary`,
          url: `/${theState}/${county}/boundary.geojson`
        }),
        selectables: available({
          name: `${county} Town Boundaries`,
          url: `/${theState}/${county}/towns.geojson`
        }),
        towns: available({
          name: `${county} Town Boundaries`,
          url: `/${theState}/${county}/towns.geojson`
        })
      }
    };
  }

  index[theState][county][town] = {
    layers: {
      boundary: available({
        name: `${town} Boundary`,
        url: `/${theState}/${county}/${town}/boundary.geojson`
      }),
      buildings: available({
        name: `${town} Buildings`,
        url: `/${theState}/${county}/${town}/buildings.geojson`
      }),
      countables: available({
        name: `${town} Countables`,
        url: `/${theState}/${county}/${town}/countables.geojson`
      }),
      lakes: available({
        name: `${town} Lakes`,
        url: `/${theState}/${county}/${town}/lakes.geojson`
      }),
      parcels: available({
        name: `${town} Parcels`,
        url: `/${theState}/${county}/${town}/parcels.geojson`
      }),
      places: available({
        name: `${town} Places of Interest`,
        url: `/${theState}/${county}/${town}/places.geojson`
      }),
      powerlines: available({
        name: `${town} Powerlines`,
        url: `/${theState}/${county}/${town}/powerlines.geojson`
      }),
      searchables: available({
        name: `${town} Searchables`,
        url: `/${theState}/${county}/${town}/searchables.geojson`
      }),
      selectables: available({
        name: `${town} Parcels`,
        url: `/${theState}/${county}/${town}/parcels.geojson`
      }),
      rivers: available({
        name: `${town} Rivers`,
        url: `/${theState}/${county}/${town}/rivers.geojson`
      }),
      roads: available({
        name: `${town} Roads`,
        url: `/${theState}/${county}/${town}/roads.geojson`
      }),
      trails: available({
        name: `${town} Trails`,
        url: `/${theState}/${county}/${town}/trails.geojson`
      })
    }
  };
});

writeFileSync(`${dist}/index.json`, JSON.stringify(index, null, 2));
