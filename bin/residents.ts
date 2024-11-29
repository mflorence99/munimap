import { readFileSync } from 'node:fs';
import { writeFileSync } from 'node:fs';

const geojson = JSON.parse(
  readFileSync('./bin/assets/washington-parcels.geojson').toString()
);

const lines = geojson.features
  .filter(
    (feature) =>
      feature.properties.ownership === 'R' && feature.properties.usage === '110'
  )
  .sort((p, q) =>
    sortaddr(p.properties.address).localeCompare(sortaddr(q.properties.address))
  )
  .reduce(
    (acc, feature) =>
      (acc += `${feature.properties.address}\t${feature.properties.owner}\t ${feature.id}\n`),
    ''
  );

writeFileSync('/home/markf/temp/residents.csv', lines);

function sortaddr(addr: string): string {
  const parts = addr.split(' ');
  const [num, ...rest] = parts;
  if (isNaN(+num)) return addr;
  else return [...rest, num.padStart(5, '0')].join(' ');
}
