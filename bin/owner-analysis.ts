import { readFileSync } from 'node:fs';

import jsome from 'jsome';

const geojson = JSON.parse(
  readFileSync('./bin/assets/washington-parcels.geojson').toString()
);

const keyOf = (addressOfOwner: string): string => {
  if (addressOfOwner) {
    const parts = addressOfOwner.split(' ');
    return `${parts.at(-3)}-${parts.at(-2)}-${parts.at(-1)}`;
  } else return 'NONE';
};

const countByOwner: Record<string, number> = geojson.features.reduce(
  (acc, feature) => {
    const key = keyOf(feature.properties.addressOfOwner);
    if (!acc[key]) acc[key] = 1;
    else acc[key] += 1;
    return acc;
  },
  {}
);

jsome(['NONE', countByOwner['NONE']]);

const descending = Object.entries(countByOwner)
  .sort((p, q) => q[1] - p[1])
  .slice(0, 9);

jsome(descending);

geojson.features
  .filter((feature) => [' ', 'X'].includes(feature.properties.ownership))
  .forEach((feature) =>
    jsome([
      feature.id,
      feature.properties.ownership,
      feature.properties.addressOfOwner
    ])
  );

const neighborhoods = new Set<string>();

geojson.features.forEach((feature) =>
  neighborhoods.add(feature.properties.neighborhood)
);

jsome(Array.from(neighborhoods));
