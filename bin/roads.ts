/* eslint-disable @typescript-eslint/naming-convention */
import { simplify } from '../lib/src/geojson';
import { theState } from '../lib/src/geojson';

import * as turf from '@turf/turf';

import { mkdirSync } from 'fs';
import { writeFileSync } from 'fs';

import chalk from 'chalk';
import shp from 'shpjs';

const url =
  'https://ftp.granit.sr.unh.edu/GRANIT_Data/Vector_Data/Transportation_Networks/d-roads/Roads_DOT';

const dist = './data';

const roadsByCountyByTown = {};

async function main(): Promise<void> {
  console.log(chalk.blue(`Loading ${url}...`));
  const roads = (await shp(url)) as GeoJSON.FeatureCollection;

  roads.features.forEach((feature: GeoJSON.Feature) => {
    // 👉 SHP files have names truncated to 10 characters
    const county = (feature.properties.COUNTY_NAM as string)?.toUpperCase();
    const town = (feature.properties.TOWN_NAME as string)?.toUpperCase();

    if (county && town) {
      // 👉 some features have bbox on the geometry, we created our own
      delete feature.geometry.bbox;

      // 👉 every feature must have an ID
      //    let's hope that UNIQUE_ID is as unique as it claims to be!
      feature.id = `${feature.properties.UNIQUE_ID}`;

      feature.bbox = turf.bbox(feature);
      feature.properties = {
        class: feature.properties.LEGIS_CLAS,
        county: feature.properties.COUNTY_NAM,
        name: feature.properties.STREET,
        owner: feature.properties.OWNERSHIP,
        town: feature.properties.TOWN_NAME,
        width: feature.properties.ROADWAY_WI
      };

      roadsByCountyByTown[county] ??= {};
      const geojson: GeoJSON.FeatureCollection = {
        features: [],
        type: 'FeatureCollection'
      };
      roadsByCountyByTown[county][town] ??= geojson;
      roadsByCountyByTown[county][town].features.push(feature);
    }
  });

  // 👉 one file per town
  Object.keys(roadsByCountyByTown).forEach((county) => {
    Object.keys(roadsByCountyByTown[county]).forEach((town) => {
      console.log(
        chalk.green(`... writing ${theState}/${county}/${town}/roads.geojson`)
      );
      mkdirSync(`${dist}/${theState}/${county}/${town}`, { recursive: true });
      writeFileSync(
        `${dist}/${theState}/${county}/${town}/roads.geojson`,
        JSON.stringify(simplify(roadsByCountyByTown[county][town]))
      );
    });
  });
}

main();

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const sample = {
  UNIQUE_ID: 146879,
  SRI: 'C0990001__',
  MP_START: 0.019,
  MP_END: 0.031,
  IS_CIRCLE: 'YES',
  STREET: 'N State St',
  TOWN_ID: '099',
  TOWN_NAME: 'CONCORD',
  SECT_LENGT: 0.012,
  SRI_TYPE: 'Circle',
  FUNCT_SYST: 5,
  FUNCT_SY_1: 'Major Collector',
  URBAN_ID: 19531,
  URBAN_NAME: 'Concord',
  POPULATION: 'POP 5K > 50K',
  IS_NHS: 'NO',
  NHS: 0,
  NHS_DESCR: '',
  IS_FED_AID: 'YES',
  TOLL: 'None',
  IS_TRK_ROU: 'NO',
  TIER: 5,
  TIER_DESCR: 'Local Roads',
  LC_LEGEND: 'Local',
  LEGIS_CLAS: 'V',
  WINTER_MAI: 'TOWN',
  SUMMER_MAI: 'TOWN',
  OWNERSHIP: 'TOWN',
  OWNERSHIP_: 'TOWN',
  HPMS_OWNER: '4',
  HPMS_OWN_1: 'City or Municipal Highway Agency',
  PLOW_LEVEL: 0,
  SURF_TYPE: 'Paved',
  ROADWAY_WI: 38,
  NUM_LANES: 1,
  LANE_WIDTH: 14,
  SHLDR_TYPE: 'Paved',
  SHLDR_TY_1: 'Paved',
  SHLDR_WIDT: 14,
  SHLDR_WI_1: 10,
  DIRECTION_: 'One way',
  COUNTY_ID: 13,
  COUNTY_NAM: 'MERRIMACK',
  EXEC_COUNC: 2,
  EXEC_COU_1: 'Dist 2 - Cinde Warmington',
  COUNTER_ID: '82099286',
  AADT_CURR_: 2020,
  AADT: 4558,
  ROUTE_HIOR: '',
  STREET_ALI: '',
  NODE_1: '3797',
  NODE_2: '3796',
  HPMS_FACIL: 2,
  HPMS_FAC_1: 'Two-way roadway',
  HPMS_THRU_: 2,
  DUAL_CARRI: 'Minor DC, Inventory Direction, 2-Way Counter',
  AGGREGATE_: 4558,
  CREATE_DAT: '2021-10-02T04:00:00.000Z',
  SHAPE_Leng: 58.607242089
};
