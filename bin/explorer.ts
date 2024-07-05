import { readFileSync } from "fs";

import jsome from "jsome";

// import shp from 'shpjs';

// const url =
//   'https://ftp.granit.sr.unh.edu/GRANIT_Data/Vector_Data/Transportation_Networks/d-trails/nhtrails';

// async function main(): Promise<void> {
//   console.log(chalk.blue(`Loading ${url}...`));
//   const collection = (await shp(url)) as GeoJSON.FeatureCollection;

//   console.log({ size: collection.features.length });

//   jsome(collection.features[0]);
//   jsome(collection.features[50]);
// }

// main();

const geojson = JSON.parse(
  readFileSync(
    "./data/NEW HAMPSHIRE/SULLIVAN/WASHINGTON/countables.geojson",
  ).toString(),
);

jsome(`# features ${geojson.features.length}`);
