import { convertArea } from '@turf/helpers';
import { convertLength } from '@turf/helpers';
import { feature } from '@turf/helpers';
import { featureCollection } from '@turf/helpers';
import { featureOf } from '@turf/invariant';
import { flattenReduce } from '@turf/meta';
import { getCoord } from '@turf/invariant';
import { getCoords } from '@turf/invariant';
import { lineString } from '@turf/helpers';
import { point } from '@turf/helpers';
import { readFileSync } from 'fs';
import { writeFileSync } from 'fs';

import area from '@turf/area';
import bearing from '@turf/bearing';
import booleanClockwise from '@turf/boolean-clockwise';
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
import kinks from '@turf/kinks';
import length from '@turf/length';
import lineIntersect from '@turf/line-intersect';
import lineOffset from '@turf/line-offset';
import lineSlice from '@turf/line-slice';
import lineToPolygon from '@turf/line-to-polygon';
import midpoint from '@turf/midpoint';
import nearestPointOnLine from '@turf/nearest-point-on-line';
import pointToLineDistance from '@turf/point-to-line-distance';
import polygonTangents from '@turf/polygon-tangents';
import polygonToLine from '@turf/polygon-to-line';
import union from '@turf/union';

// 👇 configure jsome

jsome.params.lintable = true;

// 👇 GeoJSON generics are really hard to use so we cheat
//    we use featureOf assertions for runtime checks

type FeatureCollection = GeoJSON.FeatureCollection<any, any>;
type Feature = GeoJSON.Feature<any, any>;
type Position = GeoJSON.Position;

// 🔥 debugging

const debugged = featureCollection<any, any>([]);

const DEBUG = (features: Feature[], titles: string[], color: string): any =>
  debugged.features.push(
    ...features.map(
      (feature, ix): Feature => ({
        type: 'Feature',
        geometry: feature.geometry,
        properties: {
          'fill': color,
          'fill-opacity': 0.5,
          'marker-color': color,
          'stroke': color,
          'stroke-width': 1,
          'title': titles.at(ix)
        }
      })
    )
  );

// 👇 source data

const theRoads = [
  // 'McLaughlin Rd'
  'Garfield Dr',
  'Van Buren Cir',
  'McKinley Dr',
  'Ashuelot Dr',
  'Taft Rd'
];

const theParcels = [
  '14-167',
  '14-168',
  '14-169',
  '14-170',
  '14-171',
  '14-172',
  '14-173',
  '14-174',
  '14-176',
  '14-177',
  '14-178',
  '14-179',
  '14-180',
  '14-181',
  '14-182',
  '14-183',
  '14-184',
  '14-185',
  '14-186',
  '14-187',
  '14-189',
  '14-190',
  '14-191',
  '14-192',
  '14-193',
  '14-194',
  '14-196',
  '14-197',
  '14-198',
  '14-199',
  '14-200',
  '14-201',
  '14-202',
  '14-203',
  '14-204',
  '14-205',
  '14-206',
  '14-237',
  '14-239',
  '14-240',
  '14-241',
  '14-242',
  '14-244',
  '14-245',
  '14-247',
  '14-256',
  '14-257',
  '14-263'
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

const loadem = (fn: string): FeatureCollection => {
  console.log(chalk.blue(`... reading ${fn}`));
  return JSON.parse(readFileSync(fn).toString());
};

const writem = (fn: string, geojson: FeatureCollection): void => {
  console.log(chalk.blue(`... writing ${fn}`));
  writeFileSync(fn, JSON.stringify(geojson, null, 2));
};

// ////////////////////////////////////////////////////////////////////
// 👇 specialize Turf's lineIntersect
// ////////////////////////////////////////////////////////////////////

const myLineIntersect = (
  from: Feature,
  to: Feature,
  line: Feature
): Feature => {
  featureOf(from, 'Point', 'myLineIntersect');
  featureOf(to, 'Point', 'myLineIntersect');
  featureOf(line, 'LineString', 'myLineIntersect');
  // 👉 1 meter is roughly 5 digits of lat/lon precision
  const separation = pointToLineDistance(to, line, { units: 'meters' });
  return separation <= 1
    ? to
    : lineIntersect(
        lineString([getCoord(from), getCoord(to)]),
        line
      ).features.at(-1);
};

// ////////////////////////////////////////////////////////////////////
// 👇 specialize Turf's lineOffset
// ////////////////////////////////////////////////////////////////////

const myLineOffset = (
  line: Feature,
  offset: number,
  reverse = false
): Feature => {
  featureOf(line, 'LineString', 'myLineOffset');
  const coords = getCoords(line);
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
// 👇 specialize Turf's lineSlice
// ////////////////////////////////////////////////////////////////////

const myLineSlice = (from: Feature, to: Feature, line: Feature): Feature => {
  featureOf(from, 'Point', 'myLineSlice');
  featureOf(to, 'Point', 'myLineSlice');
  // 👉 so far, so normal
  const p1 = getCoord(from);
  const p2 = getCoord(to);
  const slice1 = lineSlice(p1, p2, line);
  const coords = getCoords(line);
  // 👉 but ... is the line a ring, as extracted from a Polygon
  const isRing =
    coords.at(0)[0] === coords.at(-1)[0] &&
    coords.at(0)[1] === coords.at(-1)[1];
  if (isRing) {
    // 👉 if it is, reverse it and pick the shorter route
    const l1 = length(slice1);
    const reversed = feature<any, any>({
      coordinates: coords.slice().reverse(),
      type: 'LineString'
    });
    const slice2 = lineSlice(p1, p2, reversed);
    const l2 = length(slice2);
    return l1 < l2 ? slice1 : slice2;
  } else return slice1;
};

// ////////////////////////////////////////////////////////////////////
// 👇 specialize Turf's lineToPolygon
// ////////////////////////////////////////////////////////////////////

const myLinesToPolygon = (lines: Feature[]): Feature => {
  lines.forEach((line) => featureOf(line, 'LineString', 'myLinesToPolygon'));
  const clockwises = lines.map((line) => booleanClockwise(line));
  const coordinates = lines.reduce((acc, line, ix) => {
    const coords =
      ix > 0 && clockwises.at(ix) === clockwises.at(ix - 1)
        ? getCoords(line).slice().reverse()
        : getCoords(line);
    acc.push(...coords);
    return acc;
  }, []);
  const polygon: Feature = lineToPolygon(
    feature<any, any>({
      coordinates,
      type: 'LineString'
    })
  );
  const deformed =
    kinks(polygon).features.length > 1 ||
    polygon.geometry.type === 'MultiPolygon';
  return deformed ? null : polygon;
};

// ////////////////////////////////////////////////////////////////////
// 👇 specialize Turf's midpoint
// ////////////////////////////////////////////////////////////////////

const myMidpoint = (points: Feature[], line: Feature): Feature => {
  points.forEach((point) => featureOf(point, 'Point', 'myMidpoint'));
  featureOf(line, 'LineString', 'myLinesToPolygon');
  const p1 = points.at(0);
  const p2 = points.at(-1);
  return midpoint(p1, p2);
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

const neighborsByParcelID: Record<string, Feature[]> = parcels.reduce(
  (acc, parcel) => {
    const fatso = buffer(parcel, 10, { units: 'feet' });
    const neighbors: Feature[] = parcels.reduce((acc, neighbor) => {
      if (
        neighbor.properties.id !== parcel.properties.id &&
        booleanIntersects(neighbor, fatso)
      )
        acc.push(neighbor);
      return acc;
    }, []);
    acc[parcel.properties.id] = neighbors;
    console.log(
      chalk.magenta(
        `... ${parcel.properties.id} neighbors with ${neighbors.map(
          (neighbor) => neighbor.properties.id
        )}`
      )
    );
    return acc;
  },
  {}
);

// ////////////////////////////////////////////////////////////////////
// 👇 load the roads joined into a single Polygon per road
// ////////////////////////////////////////////////////////////////////

interface Roadway {
  centerLine: Feature /* 👈 road from database */;
  edgeFactor: number /* multiple of width for edge size */;
  leftEdge: Feature /* 👈 outside edge of road border */;
  leftSide: Feature /* 👈 inside edge of road border */;
  rightEdge: Feature /* 👈 outside edge of road border */;
  rightSide: Feature /* 👈 inside edge of road border */;
  road: Feature /* 👈 polygon of road at width 👇 */;
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
const segmentsByRoadName: Record<string, Feature[]> = roadSegments.reduce(
  (acc, feature) => {
    const segments = acc[feature.properties.name] ?? [];
    segments.push(feature);
    acc[feature.properties.name] = segments;
    return acc;
  },
  {}
);

// 👉 for each road ...
const roadways = Object.values(segmentsByRoadName).map(
  (segments: Feature[]): Roadway => {
    let centerLine = segments.at(0);
    const joined = new Set([segments.at(0)]);
    console.log(
      chalk.yellow(`...... concatenating ${centerLine.properties.name}`)
    );
    // 👉 1 meter is roughly 5 digits of lat/lon precision
    const near = (p1: Position, p2: Position): boolean =>
      distance(point(p1), point(p2), { units: 'meters' }) <= 1;
    // 👉 helper function
    const atBeginningOfRoad = (segment: Feature): boolean =>
      near(getCoords(centerLine).at(0), getCoords(segment).at(-1));
    // 👉 helper function
    const atEndOfRoad = (segment: Feature): boolean =>
      near(getCoords(centerLine).at(-1), getCoords(segment).at(0));
    // 👉 helper function
    const joinSegmentToRoadAt = (segment: Feature, ix: number): void => {
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
      segments.forEach((segment: Feature) => {
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
    const edgeFactor = 4;
    const rightSide = myLineOffset(centerLine, width / 2);
    const rightEdge = myLineOffset(rightSide, -width * edgeFactor, true);
    const leftSide = myLineOffset(centerLine, width / 2, true);
    const leftEdge = myLineOffset(leftSide, -width * edgeFactor, true);
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
      edgeFactor,
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
      const clipped = flattenReduce(
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
        featureCollection<any, any>([])
      );
      parcel.geometry = combine(clipped).features.at(0).geometry;
    });
});

// ////////////////////////////////////////////////////////////////////
// 👇 clip each parcel that intersects with a lake > 10 acres
// ////////////////////////////////////////////////////////////////////

lakes.forEach((lake: Feature) => {
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
// 👇 this algorithm gives fairly good results for regular sized
//    Polygons -- characteristic of most smaller lots
//    we try to find the edge closest to the road and fill that gap
// ////////////////////////////////////////////////////////////////////

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
    // 👉 for each parcel that intersects with the outside edge
    //    and has no more than 10 vertices and is a Polygon ...
    parcels
      .filter(
        (parcel) =>
          booleanIntersects(parcel, edge) &&
          parcel.geometry.type === 'Polygon' &&
          getCoords(parcel).length <= 10
      )
      .forEach((parcel) => {
        // 👉 we need at least 2 intersections with the outside edge
        const intersections = lineIntersect(parcel, edge);
        if (intersections.features.length < 2) return;
        // 👉 project a line from the midpoint between the intersections,
        //    through the centerline of the road and out the other side
        const anchor1 = myMidpoint(intersections.features, edge);
        const anchor2 = nearestPointOnLine(centerLine, anchor1);
        const anchor3 = destination(
          anchor2,
          convertLength(roadway.width, 'feet', 'kilometers'),
          bearing(anchor1, anchor2)
        );
        // DEBUG(
        //   [anchor1, anchor2, anchor3],
        //   ['anchor1', 'anchor2', 'anchor3'],
        //   '#c2185b'
        // );
        // 👉 from the end of this line (outside the polygon and
        //    looking back at it) the 2 tangents should mark the
        //    edge of the polygon facing the road
        const tangents = polygonTangents(
          getCoord(anchor3),
          parcel
        ).features.filter(
          (tangent, ix, array) => ix === 0 || ix === array.length - 1
        );
        if (tangents.length !== 2) return;
        // DEBUG(tangents, ['tangent', 'tangent'], '#7b1fa2');
        // 👉 now draw two "parallel" lines from "infinity"
        //    to these 2 tangent points -- where the lines intersect
        //    the inside edge should mark where the polygon must
        //    meet the road -- if the tangents are REALLY close
        //    to the road already, just use them
        const infinity = destination(
          anchor3,
          1000 /* 👈 really, 1000km away */,
          bearing(anchor1, anchor3)
        );
        const congruents = tangents
          .map((tangent) => myLineIntersect(infinity, tangent, side))
          .filter((congruent) => !!congruent);
        if (congruents.length !== 2) return;
        // DEBUG(congruents, ['congruent', 'congruent'], '#fbc02d');
        // 👉 slice the inside edge between the congruent points
        //    and the original polygon between the tangents to form
        //    the polygon of the missing space between the parcel
        //    and the road
        const sides = [
          [side, congruents],
          [polygonToLine(parcel), tangents]
        ];
        const edges = sides.map(([line, points]: [Feature, Feature[]]) =>
          myLineSlice(points.at(0), points.at(-1), line)
        );
        const missing = myLinesToPolygon(edges);
        // 👉 expand the parcel with the missing polygon
        if (missing) {
          const expanded = union(parcel, missing);
          console.log(
            chalk.cyan(`......... expanding ${parcel.properties.id}`)
          );
          parcel.geometry = expanded.geometry;
        }
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
      (lake): Feature => ({
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
      (parcel): Feature => ({
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
      (roadway): Feature => ({
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
      (roadway): Feature => ({
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
      (roadway): Feature => ({
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
    ...debugged.features
  ])
);
