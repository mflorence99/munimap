import { convertArea } from '@turf/helpers';
import { feature } from '@turf/helpers';
import { featureCollection } from '@turf/helpers';
import { flattenEach } from '@turf/meta';
import { flattenReduce } from '@turf/meta';
import { getCoord } from '@turf/invariant';
import { getCoords } from '@turf/invariant';
import { lineString } from '@turf/helpers';
import { point } from '@turf/helpers';
import { readFileSync } from 'fs';
import { writeFileSync } from 'fs';

import area from '@turf/area';
import bearing from '@turf/bearing';
import booleanIntersects from '@turf/boolean-intersects';
import buffer from '@turf/buffer';
import chalk from 'chalk';
import cleanCoords from '@turf/clean-coords';
import combine from '@turf/combine';
import destination from '@turf/destination';
import difference from '@turf/difference';
import distance from '@turf/distance';
import flatten from '@turf/flatten';
import jsome from 'jsome';
import lineIntersect from '@turf/line-intersect';
import lineOffset from '@turf/line-offset';
import lineSlice from '@turf/line-slice';
import lineToPolygon from '@turf/line-to-polygon';
import midpoint from '@turf/midpoint';
import nearestPointOnLine from '@turf/nearest-point-on-line';
import polygonTangents from '@turf/polygon-tangents';
import polygonToLine from '@turf/polygon-to-line';

// 👇 configure jsome

jsome.params.lintable = true;

// 👇 source data

const theRoads = [
  // 'McLaughlin Rd'
  'Garfield Dr',
  'Van Buren Cir',
  'McKinley Dr',
  'Ashuelot Dr'
  // 'Taft Rd'
];

const theParcels = [
  '14-167'
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
  // '14-206'
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
  // '12-49',
  // '16-78',
  // '16-79'
];

// ////////////////////////////////////////////////////////////////////
// 👇 exceptions
// ////////////////////////////////////////////////////////////////////

const notRoads = [
  'Old Haying Rd',
  'Pillsbury State Park',
  'Ulrich Rd',
  'Winding Way Rd'
];
const notParcels = [];

// ////////////////////////////////////////////////////////////////////
// 👇 helpers
// ////////////////////////////////////////////////////////////////////

const isCloseTo = (
  p1: GeoJSON.Position,
  p2: GeoJSON.Position,
  tolerance = 10 /* 👈 feet */
): boolean => {
  const from = point(p1);
  const to = point(p2);
  const dist = distance(from, to, { units: 'feet' });
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

// ////////////////////////////////////////////////////////////////////
// 👇 simplify Turf's lineOffset
// ////////////////////////////////////////////////////////////////////

const myLineOffset = (
  coords: any,
  offset: number,
  reverse = false
): GeoJSON.Feature<any, any> => {
  return lineOffset(
    {
      coordinates: reverse ? coords.slice().reverse() : coords,
      type: 'LineString'
    },
    offset / 2,
    { units: 'feet' }
  );
};

// ////////////////////////////////////////////////////////////////////
// 👇 load the lakes >= 10 acres
// ////////////////////////////////////////////////////////////////////

const lakes = loadem('./proxy/assets/washington-lakes.geojson').features.filter(
  (feature) => convertArea(feature.properties.Shape_Area, 'feet', 'acres') >= 10
);

// ////////////////////////////////////////////////////////////////////
// 👇 load the parcels
// ////////////////////////////////////////////////////////////////////

const parcels = loadem(
  './proxy/assets/washington-parcels.geojson'
).features.filter(
  (feature) =>
    !theParcels.length ||
    (theParcels.includes(feature.properties.id) &&
      !notParcels.includes(feature.properties.id))
);

// ////////////////////////////////////////////////////////////////////
// 👇 find all the parcel neighbors
// ////////////////////////////////////////////////////////////////////

const neighborsByParcelID: Record<string, GeoJSON.Feature<any, any>[]> =
  parcels.reduce((acc, parcel) => {
    const fatso = buffer(parcel, 10, { units: 'feet' });
    const neighbors: GeoJSON.Feature<any, any>[] = parcels.reduce(
      (acc, neighbor) => {
        if (
          neighbor.properties.id !== parcel.properties.id &&
          booleanIntersects(neighbor, fatso)
        )
          acc.push(neighbor);
        return acc;
      },
      []
    );
    acc[parcel.properties.id] = neighbors;
    console.log(
      chalk.magenta(
        `... ${parcel.properties.id} neighbors with ${neighbors.map(
          (neighbor) => neighbor.properties.id
        )}`
      )
    );
    return acc;
  }, {});

// ////////////////////////////////////////////////////////////////////
// 👇 load the roads joined into a single Polygon per road
// ////////////////////////////////////////////////////////////////////

interface Roadway {
  centerLine: GeoJSON.Feature<any, any> /* 👈 road from database */;
  leftEdge: GeoJSON.Feature<any, any> /* 👈 outside edge of road border */;
  leftSide: GeoJSON.Feature<any, any> /* 👈 inside edge of road border */;
  rightEdge: GeoJSON.Feature<any, any> /* 👈 outside edge of road border */;
  rightSide: GeoJSON.Feature<any, any> /* 👈 inside edge of road border */;
  road: GeoJSON.Feature<any, any> /* 👈 polygon of road at width 👇 */;
  width: number;
}

const roadSegments = loadem(
  './proxy/assets/washington-roads.geojson'
).features.filter(
  (feature) =>
    !theRoads.length ||
    (theRoads.includes(feature.properties.name) &&
      !notRoads.includes(feature.properties.name))
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
const roadways = Object.values(segmentsByRoadName).map(
  (segments: GeoJSON.Feature<any, any>[]): Roadway => {
    let centerLine = segments.at(0);
    const joined = new Set([segments.at(0)]);
    console.log(
      chalk.yellow(`...... concatenating ${centerLine.properties.name}`)
    );
    // 👉 helper function
    const atBeginningOfRoad = (segment: GeoJSON.Feature<any, any>): boolean =>
      isCloseTo(getCoords(centerLine).at(0), getCoords(segment).at(-1));
    // 👉 helper function
    const atEndOfRoad = (segment: GeoJSON.Feature<any, any>): boolean =>
      isCloseTo(getCoords(centerLine).at(-1), getCoords(segment).at(0));
    // 👉 helper function
    const joinSegmentToRoadAt = (
      segment: GeoJSON.Feature<any, any>,
      ix: number
    ): void => {
      centerLine.geometry.coordinates.splice(
        ix,
        0,
        ...segment.geometry.coordinates
      );
      centerLine.properties.width = Math.max(
        centerLine.properties.width,
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
            joinSegmentToRoadAt(
              segment,
              centerLine.geometry.coordinates.length
            );
        }
      });
    }
    // 👉 remove any duplicate coordinates
    centerLine = cleanCoords(centerLine);
    // 👉 how wide is the right-of-way in miles?
    //    calculation more-or-less copied from ol-adaptor-roads.ts
    const width = Math.max(centerLine.properties.width, 20) * 2;
    // 👉 offset the centerLine right and left create road and border
    const rightSide = myLineOffset(getCoords(centerLine), width / 2);
    const rightEdge = myLineOffset(getCoords(rightSide), -width * 4, true);
    const leftSide = myLineOffset(getCoords(centerLine), width / 2, true);
    const leftEdge = myLineOffset(getCoords(leftSide), -width * 4, true);
    const road = lineToPolygon(
      feature({
        coordinates: [...getCoords(leftSide), ...getCoords(rightSide)],
        type: 'LineString'
      }),
      {
        properties: {
          name: centerLine.properties.name
        }
      }
    );

    // 👉 composite roadway
    return {
      centerLine,
      leftEdge,
      leftSide,
      rightEdge,
      rightSide,
      road,
      width
    };
  }
);

// ////////////////////////////////////////////////////////////////////
// 👇 clip each parcel that intersects with a road and
//    discard the smallest remaining polygon
// ////////////////////////////////////////////////////////////////////

// 👉 for each road ...
roadways.forEach((roadway: Roadway) => {
  const road = roadway.road;
  console.log(
    chalk.yellow(`...... clipping parcels to ${road.properties.name}`)
  );
  // 👉 for each parcel that intersects with the road ...
  parcels
    .filter((parcel) => booleanIntersects(parcel, road))
    .forEach((parcel) => {
      console.log(chalk.cyan(`......... clipping ${parcel.properties.id}`));
      // 👉 look at each polygon separately
      const clipped: GeoJSON.FeatureCollection<any, any> = flattenReduce(
        parcel,
        (acc, polygon) => {
          // 👉 delta is the polygon minus the road
          //    sort to find the largest Polygon because the
          //    original parcel might straddle the road
          //    then use that as the clipped extent
          const delta = flatten(difference(polygon, road));
          delta.features.sort((p, q) => area(p) - area(q));
          acc.features.push(delta.features.at(-1));
          return acc;
        },
        featureCollection([])
      );
      parcel.geometry = combine(clipped).features.at(0).geometry;
    });
});

// ////////////////////////////////////////////////////////////////////
// 👇 clip each parcel that intersects with a lake > 10 acres
// ////////////////////////////////////////////////////////////////////

lakes.forEach((lake: GeoJSON.Feature<any, any>) => {
  console.log(
    chalk.yellow(`...... clipping parcels to lake ${lake.properties.OBJECTID}`)
  );
  // 👉 for each parcel that intersects with the lake ...
  parcels
    .filter((parcel) => booleanIntersects(parcel, lake))
    .forEach((parcel) => {
      console.log(chalk.cyan(`......... clipping ${parcel.properties.id}`));
      // 👉 use the difference
      parcel.geometry = difference(parcel, lake).geometry;
    });
});

// ////////////////////////////////////////////////////////////////////
// 🔥 EXPERIMENTAL
// ////////////////////////////////////////////////////////////////////

const interestingStuff = featureCollection([]);

// 👉 for each road ...
roadways.forEach((roadway: Roadway) => {
  const centerLine = roadway.centerLine;
  const edges = [roadway.leftEdge, roadway.rightEdge];
  const road = roadway.road;
  const sides = [roadway.leftSide, roadway.rightSide];
  console.log(
    chalk.blue(`...... expanding parcels to ${road.properties.name}`)
  );
  // 👉 for each roadside edge and side ...
  edges.forEach((edge, ix) => {
    const side = sides.at(ix);
    // 👉 for each parcel that intersects with the outside edge ...
    parcels
      .filter((parcel) => booleanIntersects(parcel, edge))
      .forEach((parcel) => {
        // 👉 look at each polygon separately
        flattenEach(parcel, (polygon) => {
          // 👉 we need at least 2 intersections with the outside edge
          const intersections = lineIntersect(polygon, edge);
          if (intersections.features.length < 2) return;
          // 👉 project a line from the midpoint between the intersections,
          //    through the centerline of the road and out the other side
          const anchor1 = midpoint(
            getCoord(intersections.features.at(0)),
            getCoord(intersections.features.at(-1))
          );
          const anchor2 = nearestPointOnLine(centerLine, anchor1);
          const anchor3 = destination(
            anchor2,
            distance(getCoord(anchor1), getCoord(anchor2)),
            bearing(anchor1, anchor2)
          );
          // 👉 from the end of this line (outside the polygon and
          //    looking back at it) the 2 tangents should mark the
          //    edge of the polygon facing the road
          const tangents = polygonTangents(getCoord(anchor3), polygon);
          jsome(tangents);
          const tangent1 = tangents.features.at(0);
          const tangent2 = tangents.features.at(-1);
          if (!(tangent1 && tangent2)) return;
          // 👉 now draw two "parallel" lines from "infinity"
          //    to these 2 tangent points -- where the lines intersect
          //    the inside edge should mark where the polygon must
          //    meet the road
          const infinity = destination(
            anchor3,
            1000 /* 👈 really, 1000km away */,
            bearing(anchor1, anchor3)
          );
          const congruent1 = lineIntersect(
            lineString([getCoord(infinity), getCoord(tangent1)]),
            side
          ).features.at(-1);
          const congruent2 = lineIntersect(
            lineString([getCoord(infinity), getCoord(tangent2)]),
            side
          ).features.at(-1);
          if (!(congruent1 && congruent2)) return;
          // 👉 slice the inside edge between the congruent points
          //    and the original polygon between the tangents to form
          //    the polygon of the missing space betwen the parcel
          //    and the road
          const edge1 = lineSlice(
            getCoord(congruent1),
            getCoord(congruent2),
            side
          );
          const asLine = polygonToLine(polygon) as GeoJSON.Feature<any, any>;
          jsome(asLine);
          const edge2 = lineSlice(
            getCoord(tangent1),
            getCoord(tangent2),
            asLine
          );
          const missing = featureCollection([
            ...getCoords(edge1).map((coord) => point(coord)),
            ...getCoords(edge2).map((coord) => point(coord))
          ]);
          // 🔥 TEST
          interestingStuff.features.push(...missing.features);
        });
      });
  });
});

// ////////////////////////////////////////////////////////////////////
// 👇 output modified data
// 🔥 colors just for the map viewer
// ////////////////////////////////////////////////////////////////////

writem(
  '/home/mflo/aligned.geojson',
  featureCollection([
    ...lakes.map(
      (lake): GeoJSON.Feature<any, any> => ({
        id: lake.id,
        type: 'Feature',
        geometry: lake.geometry,
        properties: {
          'fill': '#0000FF',
          'fill-opacity': 0.25,
          'OBJECTID': lake.properties.OBJECTID,
          'stroke': '#0000FF',
          'stroke-width': 1
        }
      })
    ),
    ...parcels.map(
      (parcel): GeoJSON.Feature<any, any> => ({
        id: parcel.id,
        type: 'Feature',
        geometry: parcel.geometry,
        properties: {
          'fill': '#795548',
          'fill-opacity': 0.25,
          'id': parcel.properties.id,
          'stroke': '#795548',
          'stroke-width': 3
        }
      })
    ),
    ...roadways.map(
      (roadway): GeoJSON.Feature<any, any> => ({
        id: roadway.road.properties.name,
        type: 'Feature',
        geometry: roadway.road.geometry,
        properties: {
          'fill': '#00FF00',
          'fill-opacity': 0.75,
          'name': roadway.road.properties.name,
          'stroke': '#00FF00',
          'stroke-width': 1
        }
      })
    ),
    ...roadways.map(
      (roadway): GeoJSON.Feature<any, any> => ({
        type: 'Feature',
        geometry: lineToPolygon(
          feature({
            coordinates: [
              ...getCoords(roadway.leftSide),
              ...getCoords(roadway.leftEdge)
            ],
            type: 'LineString'
          })
        ).geometry,
        properties: {
          'fill': '#FFFF00',
          'fill-opacity': 0.25,
          'stroke': '#FFFF00',
          'stroke-width': 1
        }
      })
    ),
    ...roadways.map(
      (roadway): GeoJSON.Feature<any, any> => ({
        type: 'Feature',
        geometry: lineToPolygon(
          feature({
            coordinates: [
              ...getCoords(roadway.rightSide),
              ...getCoords(roadway.rightEdge)
            ],
            type: 'LineString'
          })
        ).geometry,
        properties: {
          'fill': '#00FFFF',
          'fill-opacity': 0.25,
          'stroke': '#00FFFF',
          'stroke-width': 1
        }
      })
    ),
    ...interestingStuff.features.map(
      (thingy): GeoJSON.Feature<any, any> => ({
        type: 'Feature',
        geometry: thingy.geometry,
        properties: {
          'fill': '#8e24aa',
          'fill-opacity': 0.75,
          'stroke': '#8e24aa',
          'stroke-width': 1
        }
      })
    )
  ])
);
