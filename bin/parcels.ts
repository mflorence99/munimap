/* eslint-disable @typescript-eslint/naming-convention */
import { Features } from '../lib/src/geojson';
import { Parcel } from '../lib/src/geojson';

import { calculate } from '../lib/src/geojson';
import { normalize } from '../lib/src/geojson';
import { simplify } from '../lib/src/geojson';
import { theState } from '../lib/src/geojson';

import * as yargs from 'yargs';

import { mkdirSync } from 'fs';
import { stat } from 'fs';
import { unlinkSync } from 'fs';
import { writeFileSync } from 'fs';

import chalk from 'chalk';
import hash from 'object-hash';
import shp from 'shpjs';

const county = yargs.argv['county'];

const dist = '/efs/MuniMap/proxy';

const urlByCounty = {
  BELKNAP:
    'https://ftp.granit.sr.unh.edu/ParcelMosaic/20210301_NHParcelMosaic_CountyShapefiles/Belknap_ParcelsCAMA.zip',
  CARROLL:
    'https://ftp.granit.sr.unh.edu/ParcelMosaic/20210301_NHParcelMosaic_CountyShapefiles/Carroll_ParcelsCAMA.zip',
  CHESHIRE:
    'https://ftp.granit.sr.unh.edu/ParcelMosaic/20210301_NHParcelMosaic_CountyShapefiles/Cheshire_ParcelsCAMA.zip',
  COOS: 'https://ftp.granit.sr.unh.edu/ParcelMosaic/20210301_NHParcelMosaic_CountyShapefiles/Coos_ParcelsCAMA.zip',
  GRAFTON:
    'https://ftp.granit.sr.unh.edu/ParcelMosaic/20210301_NHParcelMosaic_CountyShapefiles/Grafton_ParcelsCAMA.zip',
  HILLSBOROUGH:
    'https://ftp.granit.sr.unh.edu/ParcelMosaic/20210301_NHParcelMosaic_CountyShapefiles/Hillsborough_ParcelsCAMA.zip',
  MERRIMACK:
    'https://ftp.granit.sr.unh.edu/ParcelMosaic/20210301_NHParcelMosaic_CountyShapefiles/Merrimack_ParcelsCAMA.zip',
  ROCKINGHAM:
    'https://ftp.granit.sr.unh.edu/ParcelMosaic/20210301_NHParcelMosaic_CountyShapefiles/Rockingham_ParcelsCAMA.zip',
  STRAFFORD:
    'https://ftp.granit.sr.unh.edu/ParcelMosaic/20210301_NHParcelMosaic_CountyShapefiles/Strafford_ParcelsCAMA.zip',
  SULLIVAN:
    'https://ftp.granit.sr.unh.edu/ParcelMosaic/20210301_NHParcelMosaic_CountyShapefiles/Sullivan_ParcelsCAMA.zip'
};

const usageByClass = {
  'Apt Bldg 5+ Units': '120',
  'Commercial Condo': '260',
  'Commercial L&B': '260',
  'Commercial Land': '260',
  'Condominiumized Land Site': '130',
  'Garage/Storage Unit': '130',
  'Industrial Condo': '260',
  'Industrial L&B': '260',
  'Industrial Land': '260',
  'Mfg Housing With Land': '130',
  'Mfg Housing Without Land': '130',
  'Mixed Use Cmcl/Ind L&B': '260',
  'Mixed Use Cmcl/Ind Land': '260',
  'Mixed Use Res/Cmcl L&B': '260',
  'Mixed Use Res/Cmcl Land': '260',
  'Multi Family 2-4 Units': '120',
  'Non Res Bldg Only': '260',
  'Res Bldg Only': '130',
  'Res Condo 2-4 Unit Bldg': '120',
  'Residential Land': '190',
  'Single Family Home': '110',
  'Single Res Condo Unit': '130',
  'Unclass/Unk Imp Res': '190',
  'Unclass/Unk Land': '190',
  'Unclass/Unk Non-Res L&B': '190',
  'Unclass/Unk Other': '190'
};

// 👇 no town can have more than this number of parcels
const tooManyParcels = 5000;

// 👇 it looks like the geometry of some towns is wonky
const tooManyZeroAreaParcelsRatio = 0.5;

// 👇 we won't even bother to look at these towns as we know they're
//    too big and analyzing them can cause out-of-memory conditions
//    NOTE: we exclude WASHINGTON because we already have its legacy data
// 👉 https://www.newhampshire-demographics.com/cities_by_population
const exclusions = [
  'CONCORD',
  'DERRY',
  'DOVER',
  'HUDSON',
  'LONDONDERRY',
  'MANCHESTER',
  'MERRIMACK',
  'NASHUA',
  'ROCHESTER',
  'SALEM',
  'WASHINGTON'
];

async function main(): Promise<void> {
  const url = urlByCounty[county];
  console.log(chalk.blue(`Loading ${url}...`));
  const parcels = (await shp(url)) as GeoJSON.FeatureCollection;

  const countByTown: Record<string, number> = {};
  const dupesByTown: Record<string, Set<string>> = {};
  const parcelsByTown: Record<string, Features> = {};
  const zeroAreaByTown: Record<string, number> = {};

  parcels.features
    .filter((feature) => feature.properties.DisplayId)
    .forEach((feature: GeoJSON.Feature<any>) => {
      // 👉 SHP files have names truncated to 10 characters
      const town = (feature.properties.TownName as string)?.toUpperCase();

      // 👉 we already have Washington via legacy data
      if (town && !exclusions.includes(town)) {
        // 👉 initialize all "by town" data structures
        countByTown[town] ??= 0;
        dupesByTown[town] ??= new Set<string>();
        parcelsByTown[town] ??= {
          features: [],
          type: 'FeatureCollection'
        } as any;
        zeroAreaByTown[town] ??= 0;

        // 👉 occasionally, the data is dirty in that the same feature
        //    appears more than once, but not necessarily with the same ID,
        //    so we dedupe by a hash of its geometry
        const signature = hash.MD5(feature.geometry);
        if (dupesByTown[town].has(signature)) return;
        dupesByTown[town].add(signature);

        // 👉 construct a parcel to represent this feature
        const parcel: Parcel = {
          action: undefined,
          geometry: feature.geometry,
          id: makeID(feature),
          owner: undefined,
          path: undefined,
          properties: {
            address: makeAddress(feature),
            area:
              Math.round(((feature.properties.Shape_Area ?? 0) / 43560) * 100) /
              100 /* 👈 sq feet to acres to 2dps */,
            building$: feature.properties.TaxBldg,
            county: county,
            id: makeID(feature),
            land$: feature.properties.TaxLand,
            other$: feature.properties.TaxFeature,
            taxed$: feature.properties.TaxTotal,
            town: town,
            usage: usageByClass[feature.properties.SLUC_desc] ?? '190'
          },
          type: 'Feature'
        };

        // 👉 we've gone to great lengths to make a bridge to share this
        //    code with MuniMap -- there' a better way but this will do
        //    for now

        calculate(parcel);
        normalize(parcel);

        // 👉 gather town's parcels together for later
        countByTown[town] += 1;
        parcelsByTown[town].features.push(parcel as any);
        if (parcel.properties.area === 0) zeroAreaByTown[town] += 1;
      }
    });

  // 👉 one file per town with <= "tooManyLots"
  Object.keys(parcelsByTown).forEach((town) => {
    const fn = `${dist}/${theState}/${county}/${town}/parcels.geojson`;
    if (
      zeroAreaByTown[town] >
      countByTown[town] * tooManyZeroAreaParcelsRatio
    ) {
      console.log(
        chalk.magenta(
          `... ${theState}/${county}/${town}/parcels.geojson has more than ${
            tooManyZeroAreaParcelsRatio * 100
          }% zero-area parcels`
        )
      );
      stat(fn, (err, _stats) => {
        if (!err) unlinkSync(fn);
      });
    } else if (countByTown[town] > tooManyParcels) {
      console.log(
        chalk.red(
          `... ${theState}/${county}/${town}/parcels.geojson has more than ${tooManyParcels} parcels`
        )
      );
      stat(fn, (err, _stats) => {
        if (!err) unlinkSync(fn);
      });
    } else {
      console.log(
        chalk.green(`... writing ${theState}/${county}/${town}/parcels.geojson`)
      );
      mkdirSync(`${dist}/${theState}/${county}/${town}`, { recursive: true });
      writeFileSync(fn, JSON.stringify(simplify(parcelsByTown[town])));
    }
  });

  // 👉 the idea behind searchables is to provide just enough data for
  //    parcels to be searched -- we do this because we MUST have ALL
  //    the data available

  Object.keys(parcelsByTown).forEach((town) => {
    const fn = `${dist}/${theState}/${county}/${town}/searchables.geojson`;
    console.log(
      chalk.green(
        `... writing ${theState}/${county}/${town}/searchables.geojson`
      )
    );
    mkdirSync(`${dist}/${theState}/${county}/${town}`, { recursive: true });
    // 👉 now do this again, converting the real parcels into searchables
    parcelsByTown[town].features = parcelsByTown[town].features.map(
      (feature: any): any => ({
        bbox: feature.bbox,
        id: feature.id,
        properties: {
          address: feature.properties.address,
          id: feature.properties.id,
          owner: feature.properties.owner
        },
        type: 'Feature'
      })
    );
    writeFileSync(fn, JSON.stringify(simplify(parcelsByTown[town])));
  });

  // 👉 the idea behind countables is to provide just enough data for
  //    parcels to be searched -- we do this because we MUST have ALL
  //    the data available

  Object.keys(parcelsByTown).forEach((town) => {
    const fn = `${dist}/${theState}/${county}/${town}/countables.geojson`;
    console.log(
      chalk.green(
        `... writing ${theState}/${county}/${town}/countables.geojson`
      )
    );
    mkdirSync(`${dist}/${theState}/${county}/${town}`, { recursive: true });
    // 👉 now do this again, converting the real parcels into countables
    parcelsByTown[town].features = parcelsByTown[town].features.map(
      (feature: any): any => ({
        id: feature.id,
        properties: {
          area: feature.properties.area,
          usage: feature.properties.usage,
          use: feature.properties.use
        },
        type: 'Feature'
      })
    );
    writeFileSync(fn, JSON.stringify(simplify(parcelsByTown[town])));
  });
}

main();

function makeAddress(feature: GeoJSON.Feature): string {
  let address;
  // 👉 sometimes number, street are conveniently separated
  if (feature.properties.StreetNumb && feature.properties.StreetName) {
    address =
      `${feature.properties.StreetNumb} ${feature.properties.StreetName}`.trim();
  }
  // 👉 sometimes address is street, number
  else if (feature.properties.StreetAddr) {
    const parts = feature.properties.StreetAddr.split(',');
    address =
      parts.length > 1
        ? `${parts[1].trim()} ${parts[0]}`
        : feature.properties.StreetAddr;
  }
  // 👉 otherwise stret name is the best we have
  else address = feature.properties.StreetName;
  return address;
}

function makeID(feature: GeoJSON.Feature): string {
  const strip0 = (str: string): string => {
    let stripped = str;
    while (stripped.length && stripped[0] === '0') stripped = stripped.slice(1);
    return stripped;
  };
  const parts = feature.properties.DisplayId.split('-')
    .map((part) => strip0(part))
    .filter((part) => part);
  return parts.join('-');
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const sample = {
  OBJECTID: 549240,
  ParcelOID: 591063,
  Name: 'ParcelID: 62-6',
  TownID: '042',
  CountyID: '10',
  TOWN: 'CLAREMONT',
  PID: '62-6',
  OID_1: '',
  NH_GIS_ID: '10042-62-6',
  SLU: '57',
  SLUC: '57',
  SLUM: '',
  Shape_Leng: 8564.18355814,
  Shape_Area: 3768708.97914,
  IS_CIRCLE: 2,
  OBJECTID_1: 106188,
  CamaOID: 106188,
  Name_1: 'CamaID: 62-6',
  LocalNBC: '200',
  NBC: 7,
  TaxLand: 101900,
  TaxBldg: 0,
  TaxFeature: 0,
  TaxTotal: 101900,
  PrevTaxLan: 101900,
  PrevTaxBld: 0,
  PrevTaxFea: 0,
  PrevTaxTot: 101900,
  CamaYear: 2020,
  CamaVendor: 8,
  U_ID: '042-438',
  NHGIS_ID: '10042-62-6',
  RawId: '62-6',
  AltId: '10042-62-6',
  DisplayId: '62-6',
  TownId_1: '042',
  CountyId_1: '10',
  SLU_1: '57',
  SLUC_1: '57',
  SLUM_1: '',
  LocalCamaI: '438',
  Map: '62',
  MapCut: '',
  Block: '',
  BlockCut: '',
  Lot: '6',
  LotCut: '',
  Unit: '',
  UnitCut: '',
  Sub: '',
  CardCount: 0,
  StreetNumb: '',
  StreetName: 'CAT HOLE RD',
  StreetAddr: 'CAT HOLE RD',
  TownName: 'Claremont',
  CountyName: 'Sullivan',
  SLUC_desc: 'Unclass/Unk Other'
};
