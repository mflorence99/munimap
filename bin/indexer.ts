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

const state = 'NEW HAMPSHIRE';

function available({ name, url }): Layer {
  return {
    available: existsSync(`${dist}${url}`),
    name,
    url
  };
}

const index: Index = {
  [state]: {
    layers: {
      boundary: available({
        name: 'New Hampshire State Boundary',
        url: `/${state}/boundary.geojson`
      }),
      counties: available({
        name: 'New Hampshire County Boundaries',
        url: `/${state}/counties.geojson`
      }),
      railroads: available({
        name: 'New Hampshire Railroads',
        url: `/${state}/railroads.geojson`
      }),
      selectables: available({
        name: 'New Hampshire County Boundaries',
        url: `/${state}/counties.geojson`
      }),
      towns: available({
        name: 'New Hampshire Town Boundaries',
        url: `/${state}/towns.geojson`
      })
    }
  }
};

towns.features.forEach((feature: GeoJSON.Feature) => {
  const county = (
    feature.properties.PB_TOWN_Census_2010_StatsCOUNTYNAME as string
  ).toUpperCase();

  const town = (feature.properties.pbpNAME as string).toUpperCase();

  console.log(chalk.green(`... indexing ${state}/${county}/${town}`));

  if (!index[state][county]) {
    index[state][county] = {
      layers: {
        boundary: available({
          name: `${county} Boundary`,
          url: `/${state}/${county}/boundary.geojson`
        }),
        selectables: available({
          name: `${county} Town Boundaries`,
          url: `/${state}/${county}/towns.geojson`
        }),
        towns: available({
          name: `${county} Town Boundaries`,
          url: `/${state}/${county}/towns.geojson`
        })
      }
    };
  }

  index[state][county][town] = {
    layers: {
      boundary: available({
        name: `${town} Boundary`,
        url: `/${state}/${county}/${town}/boundary.geojson`
      }),
      buildings: available({
        name: `${town} Buildings`,
        url: `/${state}/${county}/${town}/buildings.geojson`
      }),
      countables: available({
        name: `${town} Countables`,
        url: `/${state}/${county}/${town}/countables.geojson`
      }),
      lakes: available({
        name: `${town} Lakes`,
        url: `/${state}/${county}/${town}/lakes.geojson`
      }),
      parcels: available({
        name: `${town} Parcels`,
        url: `/${state}/${county}/${town}/parcels.geojson`
      }),
      places: available({
        name: `${town} Places of Interest`,
        url: `/${state}/${county}/${town}/places.geojson`
      }),
      powerlines: available({
        name: `${town} Powerlines`,
        url: `/${state}/${county}/${town}/powerlines.geojson`
      }),
      searchables: available({
        name: `${town} Searchables`,
        url: `/${state}/${county}/${town}/searchables.geojson`
      }),
      selectables: available({
        name: `${town} Parcels`,
        url: `/${state}/${county}/${town}/parcels.geojson`
      }),
      rivers: available({
        name: `${town} Rivers`,
        url: `/${state}/${county}/${town}/rivers.geojson`
      }),
      roads: available({
        name: `${town} Roads`,
        url: `/${state}/${county}/${town}/roads.geojson`
      }),
      trails: available({
        name: `${town} Trails`,
        url: `/${state}/${county}/${town}/trails.geojson`
      })
    }
  };
});

writeFileSync('dist/index.json', JSON.stringify(index, null, 2));
