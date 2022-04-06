import { DOMParser } from '@xmldom/xmldom';

import { gpx } from '@tmcw/togeojson';
import { readFileSync } from 'fs';
import { writeFileSync } from 'fs';

const test = './proxy/assets/landmarks/florence/mow.gpx';

const dom = new DOMParser().parseFromString(
  readFileSync(test).toString(),
  'text/xml'
);

const geojson = gpx(dom);

console.log(geojson.features[0].properties);
console.log(geojson.features[0].geometry);
