import * as turf from '@turf/turf';

// 👉 calculate bbox based on desired dimensions

export function bboxByDimensions(
  geojson: GeoJSON.FeatureCollection | GeoJSON.Feature,
  cxDesired: number,
  cyDesired: number
): GeoJSON.BBox {
  // 👉 calculate bbox dimensions
  const [minX, minY, maxX, maxY] = turf.bbox(geojson);
  const [cx, cy] = distance(minX, minY, maxX, maxY);
  // 👉 calculate amount of expansion needed
  const cxDelta = (cxDesired - cx) / 2;
  if (cxDelta < 0) console.log(`Ouch! cx -ve ${cxDelta}`);
  const cyDelta = (cyDesired - cy) / 2;
  if (cyDelta < 0) console.log(`Ouch! cy -ve ${cyDelta}`);
  // 👉 calculate new extermities
  const newMinX = turf.rhumbDestination([minX, minY], cxDelta, -90);
  const newMaxX = turf.rhumbDestination([maxX, minY], cxDelta, 90);
  const newMinY = turf.rhumbDestination([minX, minY], cyDelta, 180);
  const newMaxY = turf.rhumbDestination([minX, maxY], cyDelta, 0);
  // 👉 now we have the expanded bbox
  return [
    cxDelta ? newMinX.geometry.coordinates[0] : minX,
    cyDelta ? newMinY.geometry.coordinates[1] : minY,
    cxDelta ? newMaxX.geometry.coordinates[0] : maxX,
    cyDelta ? newMaxY.geometry.coordinates[1] : maxY
  ];
}

// 👉 calculate bbox based on desired aspect bboxByAspectRatio
//    we'll pick the best (inverting if necessary)
//    then expand to the nearest whole "units"

// 👇 function split in two to enable debug logging

export function bboxByAspectRatio(
  geojson: GeoJSON.FeatureCollection | GeoJSON.Feature,
  x: number,
  y: number
): GeoJSON.BBox {
  const [minX, minY, maxX, maxY] = bboxByAspectRatioImpl(geojson, x, y);
  // const [cx, cy] = distance(minX, minY, maxX, maxY);
  return [minX, minY, maxX, maxY];
}

function bboxByAspectRatioImpl(
  geojson: GeoJSON.FeatureCollection | GeoJSON.Feature,
  x: number,
  y: number
): GeoJSON.BBox {
  // 👉 calculate bbox dimensions
  const [minX, minY, maxX, maxY] = turf.bbox(geojson);
  const [cx, cy] = distance(minX, minY, maxX, maxY);
  // 👉 compare aspect ratios and pick best one
  const ar = cx / cy;
  // 👉 bias square or nearly square to landscape (4:3)
  if (ar < 0.9) [y, x] = [x, y];
  // 👉 try 3:4 where cy is larger than cx
  let z = (cx * y) / x;
  if (z > cy) {
    // note 500m buffer
    return bboxByDimensions(geojson, cx + 0.375, z + 0.5);
  }
  // 👉 OK, must be 4:3 where cx is larger than cy
  else {
    z = (cy * x) / y;
    // note 500m buffer
    return bboxByDimensions(geojson, z + 0.5, cy + 0.375);
  }
}

function distance(
  minX: number,
  minY: number,
  maxX: number,
  maxY: number
): [number, number] {
  const cx = turf.rhumbDistance([minX, minY], [maxX, minY], {
    units: 'kilometers'
  });
  const cy = turf.rhumbDistance([minX, minY], [minX, maxY], {
    units: 'kilometers'
  });
  return [cx, cy];
}
