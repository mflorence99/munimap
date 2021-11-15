import * as turf from '@turf/turf';

export type Units = 'kilometers' | 'miles';

// 👉 calculate bbox based on desired dimensions

export function bboxByDimensions(
  geojson: GeoJSON.FeatureCollection | GeoJSON.Feature,
  cxDesired: number,
  cyDesired: number,
  units: Units
): GeoJSON.BBox {
  // 👉 calculate bbox dimensions
  const [minX, minY, maxX, maxY] = turf.bbox(geojson);
  const cxActual = turf.distance(
    turf.point([minX, minY]),
    turf.point([maxX, minY]),
    { units }
  );
  const cyActual = turf.distance(
    turf.point([minX, minY]),
    turf.point([minX, maxY]),
    { units }
  );
  // 👉 calculate amount of expansion needed
  const cxDelta = (cxDesired - cxActual) / 2;
  if (cxDelta < 0) console.log(`Ouch! cx -ve ${cxDelta}`);
  const cyDelta = (cyDesired - cyActual) / 2;
  if (cyDelta < 0) console.log(`Ouch! cy -ve ${cyDelta}`);
  // 👉 calculate new extermities
  const newMinX = turf.destination(turf.point([minX, minY]), cxDelta, -90);
  const newMaxX = turf.destination(turf.point([maxX, minY]), cxDelta, 90);
  const newMinY = turf.destination(turf.point([minX, minY]), cyDelta, 180);
  const newMaxY = turf.destination(turf.point([minX, maxY]), cyDelta, 0);
  // 👉 now we have the expanded bbox
  return [
    newMinX.geometry.coordinates[0],
    newMinY.geometry.coordinates[1],
    newMaxX.geometry.coordinates[0],
    newMaxY.geometry.coordinates[1]
  ];
}

// 👉 calculate bbox based on desired aspect bboxByAspectRatio
//    we'll pick the best (inverting if necessary)
//    then expand to the nearest whole "units"

export function bboxByAspectRatio(
  geojson: GeoJSON.FeatureCollection | GeoJSON.Feature,
  x: number,
  y: number,
  units: Units
): GeoJSON.BBox {
  // 👉 calculate bbox dimensions rounded up to nearest whole units
  const [minX, minY, maxX, maxY] = turf.bbox(geojson);
  const cx = turf.distance(turf.point([minX, minY]), turf.point([maxX, minY]), {
    units
  });
  const cy = turf.distance(turf.point([minX, minY]), turf.point([minX, maxY]), {
    units
  });
  // 👉 compare aspect ratios and pick best one
  const ar = cx / cy;
  if (ar < 1) [y, x] = [x, y];
  let z = (cx * y) / x;
  if (z > cy) {
    return bboxByDimensions(geojson, cx, z, units);
  } else {
    z = (cy * x) / y;
    return bboxByDimensions(geojson, z, cy, units);
  }
}
