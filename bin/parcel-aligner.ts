import { convertArea } from '@turf/helpers';
import { convertLength } from '@turf/helpers';
import { featureCollection } from '@turf/helpers';
import { point } from '@turf/helpers';
import { polygon } from '@turf/helpers';
import { readFileSync } from 'fs';
import { writeFileSync } from 'fs';

import area from '@turf/area';
import booleanIntersects from '@turf/boolean-intersects';
import buffer from '@turf/buffer';
import chalk from 'chalk';
import cleanCoords from '@turf/clean-coords';
import difference from '@turf/difference';
import distance from '@turf/distance';
// import jsome from 'jsome';

// 👇 source data

const theRoads = [
  'McLaughlin Rd'
  // 'Garfield Dr', 'Van Buren Cir', 'McKinley Dr', 'Ashuelot Dr'
];

const theParcels = [
  // '14-167',
  // '14-168',
  // '14-169',
  // '14-170',
  // '14-171',
  // '14-172',
  // '14-173',
  // '14-174',
  // '14-176',
  // '14-177',
  // '14-178',
  // '14-179',
  // '14-180',
  // '14-181',
  // '14-182',
  // '14-183',
  // '14-184',
  // '14-185',
  // '14-186',
  // '14-187',
  // '14-189',
  // '14-190',
  // '14-191',
  // '14-192',
  // '14-193',
  // '14-194',
  // '14-196',
  // '14-197',
  // '14-198',
  // '14-199',
  // '14-200',
  // '14-201',
  // '14-202',
  // '14-203',
  // '14-204',
  // '14-205',
  // '14-237',
  // '14-239',
  // '14-240',
  // '14-241',
  // '14-242',
  // '14-244',
  // '14-245',
  // '14-247',
  // '14-256',
  // '14-257',
  // '14-263'
  '12-49'
];

// 👇 exceptions

const notRoads = [
  'Old Haying Rd',
  'Pillsbury State Park',
  'Ulrich Rd',
  'Winding Way Rd'
];
const notParcels = [];

// 👇 helpers

const isCloseTo = (
  p1: GeoJSON.Position,
  p2: GeoJSON.Position,
  tolerance = 10 /* 👈 feet */
): boolean => {
  const from = point(p1);
  const to = point(p2);
  const dist = convertLength(
    distance(from, to, { units: 'miles' }),
    'miles',
    'feet'
  );
  return dist <= tolerance;
};

const loadem = (fn: string): GeoJSON.FeatureCollection<any, any> => {
  console.log(chalk.blue(`... reading ${fn}`));
  return JSON.parse(readFileSync(fn).toString());
};

const writem = (
  fn: string,
  geojson: GeoJSON.FeatureCollection<any, any>
): void => {
  console.log(chalk.blue(`... writing ${fn}`));
  writeFileSync(fn, JSON.stringify(geojson, null, 2));
};

// 👇 load the lakes >= 10 acres

const lakes = loadem('./proxy/assets/washington-lakes.geojson')
  .features.filter(
    (feature) =>
      convertArea(feature.properties.Shape_Area, 'feet', 'acres') >= 10
  )
  // 🔥 just for map viewer
  .map(
    (feature): GeoJSON.Feature<any, any> => ({
      id: feature.id,
      type: 'Feature',
      geometry: feature.geometry,
      properties: {
        'name': feature.properties.name,
        'fill': '#0000FF',
        'fill-opacity': 0.5,
        'id': feature.properties.OBJECTID,
        'stroke-width': 0
      }
    })
  );

// 👇 load the parcels

const parcels = loadem('./proxy/assets/washington-parcels.geojson')
  .features.filter(
    (feature) =>
      !theParcels.length ||
      (theParcels.includes(feature.properties.id) &&
        !notParcels.includes(feature.properties.id))
  )
  // 🔥 just for map viewer
  .map(
    (feature): GeoJSON.Feature<any, any> => ({
      id: feature.id,
      type: 'Feature',
      geometry: feature.geometry,
      properties: {
        'id': feature.properties.id,
        'fill': '#800000',
        'fill-opacity': 0.5,
        'stroke': '#FF0000',
        'stroke-width': 1
      }
    })
  );

// 👇 load the roads joined into a single Polygon per road

const roadSegments = loadem('./proxy/assets/washington-roads.geojson')
  .features.filter(
    (feature) =>
      !theRoads.length ||
      (theRoads.includes(feature.properties.name) &&
        !notRoads.includes(feature.properties.name))
  )
  // 🔥 just for map viewer
  .map(
    (feature): GeoJSON.Feature<any, any> => ({
      id: feature.id,
      type: 'Feature',
      geometry: feature.geometry,
      properties: {
        'name': feature.properties.name,
        'fill': '#008000',
        'fill-opacity': 0.5,
        'stroke': '#00FF00',
        'stroke-width': 1,
        'width': feature.properties.width
      }
    })
  );

// 👉 gather all the segments for a road together
const segmentsByRoadName: Record<string, GeoJSON.Feature<any, any>[]> =
  roadSegments.reduce((acc, feature) => {
    const segments = acc[feature.properties.name] ?? [];
    segments.push(feature);
    acc[feature.properties.name] = segments;
    return acc;
  }, {});

// 👉 for each road ...
const roads = Object.values(segmentsByRoadName).map(
  (segments: GeoJSON.Feature<any, any>[]) => {
    const road = segments[0];
    const joined = new Set([segments[0]]);
    console.log(chalk.yellow(`...... concatenating ${road.properties.name}`));
    // 👉 helper function
    const atBeginningOfRoad = (segment: GeoJSON.Feature<any, any>): boolean =>
      isCloseTo(
        road.geometry.coordinates.at(0),
        segment.geometry.coordinates.at(-1)
      );
    // 👉 helper function
    const atEndOfRoad = (segment: GeoJSON.Feature<any, any>): boolean =>
      isCloseTo(
        road.geometry.coordinates.at(-1),
        segment.geometry.coordinates.at(0)
      );
    // 👉 helper function
    const joinSegmentToRoadAt = (
      segment: GeoJSON.Feature<any, any>,
      ix: number
    ): void => {
      road.geometry.coordinates.splice(ix, 0, ...segment.geometry.coordinates);
      road.properties.width = Math.max(
        road.properties.width,
        segment.properties.width
      );
      joined.add(segment);
    };
    // 👉 join the segments into one continuous LineString
    while (joined.size !== segments.length) {
      segments.forEach((segment: GeoJSON.Feature<any, any>) => {
        if (!joined.has(segment)) {
          if (atBeginningOfRoad(segment)) joinSegmentToRoadAt(segment, 0);
          else if (atEndOfRoad(segment))
            joinSegmentToRoadAt(segment, road.geometry.coordinates.length);
        }
      });
    }
    // 👉 fatten the road to make a polygon as wide as the right of way
    //    width calculation more-or-less copied from ol-adaptor-roads.ts
    const width = Math.max(road.properties.width, 20) * 2;
    return buffer(cleanCoords(road), convertLength(width, 'feet', 'miles'), {
      units: 'miles'
    });
  }
);

// 👇 clip each parcel that intersects with a road and
//    discard the smallest remaining polygon

// 👉 for each road ...
roads.forEach((road: GeoJSON.Feature<any, any>) => {
  console.log(
    chalk.yellow(`...... clipping parcels to ${road.properties.name}`)
  );
  // 👉 helper function
  const numPolygons = (feature: GeoJSON.Feature<any, any>): number =>
    feature.geometry.type === 'MultiPolygon'
      ? feature.geometry.coordinates.length
      : 1;
  // 👉 for each parcel that intersects with the road ...
  parcels
    .filter((parcel) => booleanIntersects(parcel, road))
    .forEach((parcel) => {
      console.log(chalk.cyan(`......... clipping ${parcel.properties.id}`));
      // 👉 see if there's a difference
      const clipped = difference(parcel, road);
      if (clipped) {
        const numClippedPolygons = numPolygons(clipped);
        const numParcelPolygons = numPolygons(parcel);
        // 👉 if the number of polygons increased, drop the excess
        if (numClippedPolygons > numParcelPolygons) {
          // put the smallest ones first
          clipped.geometry.coordinates.sort((p, q): number => {
            return area(polygon(p)) - area(polygon(q));
          });
          // delete them from the beginning
          clipped.geometry.coordinates.splice(
            0,
            numClippedPolygons - numParcelPolygons
          );
        }
        // 👉 use the difference
        parcel.geometry = clipped.geometry;
      }
    });
});

// 👇 clip each parcel that intersects with a lake > 10 acres

lakes.forEach((lake: GeoJSON.Feature<any, any>) => {
  console.log(
    chalk.yellow(`...... clipping parcels to lake ${lake.properties.id}`)
  );
  // 👉 for each parcel that intersects with the lake ...
  parcels
    .filter((parcel) => booleanIntersects(parcel, lake))
    .forEach((parcel) => {
      console.log(chalk.cyan(`......... clipping ${parcel.properties.id}`));
      // 👉 calculate the difference
      const clipped = difference(parcel, lake);
      if (clipped) parcel.geometry = clipped.geometry;
    });
});

// 👇 output modified data

writem(
  '/home/mflo/aligned.geojson',
  featureCollection([...lakes, ...parcels, ...roads])
);
