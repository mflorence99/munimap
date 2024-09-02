import { featureCollection } from "@turf/helpers";
import { calculateParcel } from "../lib/src/common";
import { simplify } from "../lib/src/common";

import * as turf from "@turf/turf";

import { readFileSync } from "fs";
import { writeFileSync } from "fs";
import { deepEqual } from "fast-equals";

import chalk from "chalk";
import copy from "fast-copy";
import jsome from "jsome";

// 🔥 this is a one-time pass only -- do not repeat!

// 👇 configure jsome

jsome.params.lintable = true;

// 👇 GeoJSON generics are really hard to use so we cheat
//    we use featureOf assertions for runtime checks

type FeatureCollection = GeoJSON.FeatureCollection<any, any>;
type Feature = GeoJSON.Feature<any, any>;
type Position = GeoJSON.Position;

// 🔥 debugging

const debugged = turf.featureCollection<any, any>([]);

// const DEBUG = (features: Feature[], color: string): any => {
//   debugged.features.push(
//     ...features.map(
//       (feature): Feature => ({
//         type: 'Feature',
//         geometry: feature.geometry,
//         properties: {
//           'fill': color,
//           'fill-opacity': 0.5,
//           'marker-color': color,
//           'stroke': color,
//           'stroke-width': 1
//         }
//       })
//     )
//   );
// };

// ////////////////////////////////////////////////////////////////////
// 👇 source data and exceptions
// ////////////////////////////////////////////////////////////////////

const theRoads = [];

const dupeRoads = [
  // 🔥 two roads with same name, or discontiguous road
  "Purling Beck Rd"
];

const notRoads = [
  "Gordon Rd",
  "No Name",
  "Old Haying Rd",
  "Pillsbury State Park",
  "Ulrich Rd",
  "Winding Way Rd"
];

const theParcels = ["^25-[\\d]+", "^26-[\\d]+", "^27-[\\d]+"];

// const theParcels = ['^3-4$'];

const notParcels = [
  // 👇 very small islands that get totally clipped by lake
  "12-206",
  "12-207",
  "12-208",
  "15-82"
];

// ////////////////////////////////////////////////////////////////////
// 👇 helpers
// ////////////////////////////////////////////////////////////////////

const loadem = (fn: string): FeatureCollection => {
  console.log(chalk.blue(`reading ${fn}`));
  return JSON.parse(readFileSync(fn).toString());
};

const writem = (fn: string, geojson: FeatureCollection, space = 2): void => {
  console.log(chalk.blue(`writing ${fn}`));
  writeFileSync(fn, JSON.stringify(geojson, null, space));
};

// ////////////////////////////////////////////////////////////////////
// 👇 load the parcels
// ////////////////////////////////////////////////////////////////////

const allParcels = loadem("./bin/assets/washington-parcels.geojson");

const allParcelsByID = allParcels.features.reduce((acc, parcel) => {
  acc[parcel.id] = parcel;
  return acc;
}, {});

const parcels = allParcels.features.filter(
  (parcel) =>
    (!theParcels.length ||
      theParcels.some((id) => new RegExp(id).test(String(parcel.id)))) &&
    !notParcels.includes(String(parcel.id))
);

const bbox = turf.bboxPolygon(turf.bbox(turf.featureCollection(parcels)));

// ////////////////////////////////////////////////////////////////////
// 👇 load the lakes >= 10 acres
//    find all the parcels that overlay the lake
// ////////////////////////////////////////////////////////////////////

interface Lakeside {
  lake: Feature;
  parcelsOverLake: Feature[];
}

// 👉 a bit clumsy but meant to mirror how we do raodways
const lakesides: Lakeside[] = loadem("./bin/assets/washington-lakes.geojson")
  .features.filter(
    (lake) =>
      turf.convertArea(lake.properties.Shape_Area, "feet", "acres") >= 10
  )
  .map((lake) => {
    console.log(chalk.yellow(`- analyzing lake ${lake.id}`));
    const parcelsOverLake = [];
    parcels.forEach((parcel) => {
      if (turf.intersect(featureCollection([parcel, lake])))
        parcelsOverLake.push(parcel);
    });
    const lakeside = { lake, parcelsOverLake };
    return lakeside;
  });

// ////////////////////////////////////////////////////////////////////
// 👇 load the roads joined into a single Polygon per road
// ////////////////////////////////////////////////////////////////////

interface Roadway {
  centerLine: Feature /* 👈 road from database */;
  edgeFactor: number /* multiple of width for edge size */;
  leftBorder: Feature /* 👈 left road border */;
  leftInsideEdge: Feature /* 👈 outside edge of road border */;
  leftOutsideEdge: Feature /* 👈 inside edge of road border */;
  parcelsOnLeft: Feature[] /* 👈 parcels on the left side */;
  parcelsOnRight: Feature[] /* 👈 parcels on the right side */;
  parcelsOverRoad: Feature[] /* 👈 parcels that cross the road */;
  rightBorder: Feature /* 👈 right road border */;
  rightInsideEdge: Feature /* 👈 inside edge of road border */;
  rightOutsideEdge: Feature /* 👈 outside edge of road border */;
  road: Feature /* 👈 polygon of road at width 👇 */;
  width: number;
}

const roadSegments = loadem(
  "./bin/assets/washington-roads.geojson"
).features.filter(
  (feature) =>
    (!theRoads.length || theRoads.includes(feature.properties.name)) &&
    !notRoads.includes(feature.properties.name)
);

// 👉 gather all the segments for a road together
const segmentsByRoadName: Record<string, Feature[]> = roadSegments.reduce(
  (acc, feature, ix) => {
    let nm = feature.properties.name;
    if (dupeRoads.includes(nm)) nm = `${nm} ${ix + 1}`;
    const segments = acc[nm] ?? [];
    segments.push(feature);
    acc[nm] = segments;
    return acc;
  },
  {}
);

// 👉 for each road ...
const roadways = Object.values(segmentsByRoadName).map(
  (segments: Feature[]): Roadway => {
    // 👉 1 meter is roughly 5 digits of lat/lon precision
    const near = (p1: Position, p2: Position): boolean =>
      turf.distance(turf.point(p1), turf.point(p2), {
        units: "meters"
      }) <= 1;
    // 👉 helper functions
    const atBeginningOfRoad = (segment: Feature): boolean =>
      near(turf.getCoords(centerLine).at(0), turf.getCoords(segment).at(-1));
    const atEndOfRoad = (segment: Feature): boolean =>
      near(turf.getCoords(centerLine).at(-1), turf.getCoords(segment).at(0));
    const startsAtBeginning = (segment: Feature): boolean =>
      near(turf.getCoords(centerLine).at(0), turf.getCoords(segment).at(0));
    const endsAtEnd = (segment: Feature): boolean =>
      near(turf.getCoords(centerLine).at(-1), turf.getCoords(segment).at(-1));
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
    // 👉 helper function
    const lineOffset = (
      line: Feature,
      offset: number,
      reverse = false
    ): Feature =>
      turf.lineOffset(
        reverse
          ? turf.feature({
              coordinates: turf.getCoords(line).slice().reverse(),
              type: "LineString"
            })
          : line,
        offset,
        {
          units: "feet"
        }
      );
    // 👉 helper function
    const rewind = (segment: Feature): Feature => {
      segment.geometry.coordinates.reverse();
      return segment;
    };
    // 👉 join the segments into one continuous LineString
    let centerLine = segments.at(0);
    const joined = new Set([centerLine]);
    console.log(chalk.yellow(`- concatenating ${centerLine.properties.name}`));
    while (joined.size !== segments.length) {
      segments.forEach((segment: Feature) => {
        if (!joined.has(segment)) {
          if (atBeginningOfRoad(segment)) joinSegmentToRoadAt(segment, 0);
          else if (atEndOfRoad(segment))
            joinSegmentToRoadAt(
              segment,
              centerLine.geometry.coordinates.length
            );
          else if (startsAtBeginning(segment))
            joinSegmentToRoadAt(rewind(segment), 0);
          else if (endsAtEnd(segment))
            joinSegmentToRoadAt(
              rewind(segment),
              centerLine.geometry.coordinates.length
            );
        }
      });
    }
    // 👉 remove any duplicate coordinates
    centerLine = turf.cleanCoords(centerLine);
    // 👉 how wide is the right-of-way in miles?
    //    calculation more-or-less copied from ol-adaptor-roads.ts
    const width = Math.max(centerLine.properties.width, 20) * 3;
    // 👉 offset the centerLine right and left create road and border
    const edgeFactor = 2;
    const rightInsideEdge = lineOffset(centerLine, width / 2);
    const rightOutsideEdge = lineOffset(
      rightInsideEdge,
      -width * edgeFactor,
      true
    );
    const rightBorder = turf.lineToPolygon(
      turf.feature({
        coordinates: [
          ...turf.getCoords(rightInsideEdge),
          ...turf.getCoords(rightOutsideEdge)
        ],
        type: "LineString"
      })
    );
    const leftInsideEdge = lineOffset(centerLine, width / 2, true);
    const leftOutsideEdge = lineOffset(
      leftInsideEdge,
      -width * edgeFactor,
      true
    );
    const leftBorder = turf.lineToPolygon(
      turf.feature({
        coordinates: [
          ...turf.getCoords(leftOutsideEdge),
          ...turf.getCoords(leftInsideEdge)
        ],
        type: "LineString"
      })
    );
    const road = turf.lineToPolygon(
      turf.feature({
        coordinates: [
          ...turf.getCoords(leftInsideEdge),
          ...turf.getCoords(rightInsideEdge)
        ],
        type: "LineString"
      }),
      {
        properties: {
          name: centerLine.properties.name
        }
      }
    );
    // 👉 find the intersecting parcels
    const parcelsOverRoad: Feature[] = [];
    console.log(chalk.cyan("-- analyzing parcel intersections"));
    parcels.forEach((parcel) => {
      if (turf.intersect(featureCollection([parcel, road])))
        parcelsOverRoad.push(parcel);
    });
    // 👉 composite roadway
    return {
      centerLine,
      edgeFactor,
      leftBorder,
      leftInsideEdge,
      leftOutsideEdge,
      parcelsOnLeft: [] /* 👈 found later, see below */,
      parcelsOnRight: [] /* 👈 found later, see below */,
      parcelsOverRoad,
      rightBorder,
      rightInsideEdge,
      rightOutsideEdge,
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
  console.log(
    chalk.yellow(`- clipping parcels to ${roadway.road.properties.name}`)
  );
  // 👉 for each parcel that intersects with the road ...
  roadway.parcelsOverRoad.forEach((parcel) => {
    console.log(chalk.cyan(`-- clipping ${parcel.id}`));
    // 👉 look at each polygon separately
    const clipped = turf.meta.flattenReduce(
      parcel,
      (acc, polygon) => {
        // 👉 delta is the polygon minus the road
        //    sort to find the largest Polygon because the
        //    original parcel might straddle the road
        //    then use that as the clipped extent
        const delta = turf.flatten(
          turf.difference(featureCollection([polygon, roadway.road]))
        );
        delta.features.sort((p, q) => turf.area(p) - turf.area(q));
        acc.features.push(delta.features.at(-1));
        return acc;
      },
      turf.featureCollection<any, any>([])
    );
    parcel.geometry = turf.combine(clipped).features.at(0).geometry;
    // 🔥 if the parcel ended up as a degenerate MultiPolygon,
    //    hack it back to a normal Polygon
    if (
      parcel.geometry.type === "MultiPolygon" &&
      parcel.geometry.coordinates.length === 1
    ) {
      parcel.geometry.type = "Polygon";
      parcel.geometry.coordinates = parcel.geometry.coordinates.at(0);
    }
  });
});

// ////////////////////////////////////////////////////////////////////
// 👇 once the parcels have been clipped, find those that border the road
// ////////////////////////////////////////////////////////////////////

// 👉 for each road ...
roadways.forEach((roadway: Roadway) => {
  console.log(
    chalk.yellow(
      `- finding parcels that border ${roadway.road.properties.name}`
    )
  );
  // 🔥 to avoid false positives from clips at road intersections
  const intersect = (p: Feature, q: Feature): boolean => {
    const intersection = turf.intersect(featureCollection([p, q]));
    // 🔥 125 m2 is just a guess for a clip to ignore
    //    approx 75ft x 75ft
    return intersection != null && turf.area(intersection) >= 125;
  };
  // 👉 find the intersecting parcels
  console.log(chalk.cyan("-- analyzing parcel intersections"));
  parcels.forEach((parcel) => {
    if (intersect(parcel, roadway.leftBorder))
      roadway.parcelsOnLeft.push(parcel);
    if (intersect(parcel, roadway.rightBorder))
      roadway.parcelsOnRight.push(parcel);
  });
});

// ////////////////////////////////////////////////////////////////////
// 👇 model the missing gap between a parcel and the road
// ////////////////////////////////////////////////////////////////////

class Gap {
  onParcel: Feature[] = [];
  onRoadside: Feature[] = [];
  parcel: Feature = null;
  polygon: Feature = null;
  roadside: Feature = null;

  constructor(roadside?: Feature) {
    this.roadside = roadside;
  }

  // 👇 expand the parcel with the gap

  expand(): void {
    if (this.parcel) {
      try {
        // 👉 slice the roadside and the parcel to form
        //    the polygon of the gap between the parcel and the road
        const sides = [
          [this.roadside, this.onRoadside],
          [turf.polygonToLine(this.polygon), this.onParcel]
        ];
        const edges = sides.map(([line, points]: [Feature, Feature[]]) =>
          this.lineSlice(points.at(0), points.at(-1), line)
        );
        const gap = this.linesToPolygon(edges);
        // 👉 expand the parcel with the gap between it and the road
        if (gap) {
          const expanded = turf.union(featureCollection([this.parcel, gap]));
          console.log(chalk.cyan(`-- expanding ${this.parcel.id}`));
          this.parcel.geometry = expanded.geometry;
        }
      } catch (error) {
        console.log(chalk.red(`-- ${error.message} ${this.parcel.id}`));
      }
    }
  }

  // 👇 specialize Turf's lineSlice

  lineSlice(from: Feature, to: Feature, line: Feature): Feature {
    turf.featureOf(from, "Point", "lineSlice");
    turf.featureOf(to, "Point", "lineSlice");
    // 👉 so far, so normal
    const p1 = turf.getCoord(from);
    const p2 = turf.getCoord(to);
    const slice1 = turf.lineSlice(p1, p2, line);
    const coords = turf.getCoords(line);
    // 👉 but ... is the line a ring, as extracted from a Polygon
    const isRing =
      coords.at(0)[0] === coords.at(-1)[0] &&
      coords.at(0)[1] === coords.at(-1)[1];
    if (isRing) {
      // 👉 if it is, reverse it and pick the shorter route
      const l1 = turf.length(slice1);
      const reversed = turf.feature<any, any>({
        coordinates: coords.slice().reverse(),
        type: "LineString"
      });
      const slice2 = turf.lineSlice(p1, p2, reversed);
      const l2 = turf.length(slice2);
      return l1 < l2 ? slice1 : slice2;
    } else return slice1;
  }

  // 👇 specialize Turf's lineToPolygon

  linesToPolygon(lines: Feature[]): Feature {
    lines.forEach((line) =>
      turf.featureOf(line, "LineString", "linesToPolygon")
    );
    const clockwises = lines.map((line) => turf.booleanClockwise(line));
    const coordinates = lines.reduce((acc, line, ix) => {
      const coords =
        ix > 0 && clockwises.at(ix) === clockwises.at(ix - 1)
          ? turf.getCoords(line).slice().reverse()
          : turf.getCoords(line);
      acc.push(...coords);
      return acc;
    }, []);
    const polygon: Feature = turf.lineToPolygon(
      turf.feature<any, any>({
        coordinates,
        type: "LineString"
      })
    );
    const deformed =
      turf.kinks(polygon).features.length > 1 ||
      polygon.geometry.type === "MultiPolygon";
    return deformed ? null : polygon;
  }
}

// ////////////////////////////////////////////////////////////////////
// 👇 fill the gap between the polygons of a parcel with the road
// ////////////////////////////////////////////////////////////////////

// 👉 for each road ...
roadways.forEach((roadway: Roadway) => {
  // 👉 go up and down the road ...
  //    NOTE: sides must go in same direction
  [roadway.leftInsideEdge, roadway.rightInsideEdge].forEach((inside, ix) => {
    const parcels = [roadway.parcelsOnLeft, roadway.parcelsOnRight].at(ix);
    // 👉 quick exit if no parcels
    if (parcels.length === 0) return;
    // 👉 traverse each side N feet at a time
    //    looking for gaps between parcel and road
    let gap = new Gap(inside);
    const length = turf.length(inside, { units: "feet" });
    for (let along = 0; along < length; along += 1) {
      // 👉 create a probe line perpendicular to the road
      //    quick exit if outside bbox
      const onInside = turf.along(inside, along, { units: "feet" });
      if (!turf.booleanPointInPolygon(onInside, bbox)) continue;
      const onCenter = turf.nearestPointOnLine(roadway.centerLine, onInside);
      const onOutside = turf.destination(
        onInside,
        roadway.width * roadway.edgeFactor,
        turf.bearing(onCenter, onInside),
        { units: "feet" }
      );
      const probe = turf.lineString([
        turf.getCoord(onCenter),
        turf.getCoord(onInside),
        turf.getCoord(onOutside)
      ]);
      // DEBUG([onCenter, onInside, onOutside, probe], '#000000');
      // 👉 now see what parcel it hits first and where
      const hit = parcels.reduce(
        (acc, parcel) => {
          const hits = turf.flattenReduce(
            parcel,
            (acc, polygon) => {
              acc.push(
                ...turf.lineIntersect(probe, polygon).features.map((hit) =>
                  turf.feature(hit.geometry, {
                    distance: turf.distance(onCenter, hit),
                    polygon
                  })
                )
              );
              return acc;
            },
            []
          );
          // 👉 get the closest first
          hits.sort((p, q) => p.properties.distance - q.properties.distance);
          const hit = hits.at(0);
          if (
            hit &&
            hit.properties.distance < acc.onParcel.properties.distance
          ) {
            acc.onParcel = hit;
            acc.onRoadside = onInside;
            acc.parcel = parcel;
            acc.polygon = hit.properties.polygon;
          }
          return acc;
        },
        {
          onParcel: turf.feature(null, { distance: Number.MAX_VALUE }),
          onRoadside: null,
          parcel: null,
          polygon: null
        }
      );
      // 👉 when we get a parcel hit ...
      if (hit.parcel) {
        // 👉 start a new gap when the parcel changes
        if (gap.parcel?.id !== hit.parcel.id) {
          gap.expand();
          gap = new Gap(inside);
        }
        // 👉 capture a new gap
        gap.onParcel.push(hit.onParcel);
        gap.onRoadside.push(hit.onRoadside);
        gap.parcel = hit.parcel;
        gap.polygon = hit.polygon;
      }
    }
    // 👉 emit any residual gap
    gap.expand();
  });
});

// ////////////////////////////////////////////////////////////////////
// 👇 clip each parcel that overlays the lake
// ////////////////////////////////////////////////////////////////////

lakesides.forEach((lakeside: Lakeside) => {
  console.log(chalk.yellow(`- clipping parcels to lake ${lakeside.lake.id}`));
  // 👉 for each parcel that intersects with the lake ...
  lakeside.parcelsOverLake.forEach((parcel) => {
    console.log(chalk.cyan(`-- clipping ${parcel.id}`));
    // 👉 use the difference
    parcel.geometry = turf.difference(
      featureCollection([parcel, lakeside.lake])
    ).geometry;
  });
});

// ////////////////////////////////////////////////////////////////////
// 👇 clip parcels that overlap each other
// ////////////////////////////////////////////////////////////////////

parcels.forEach((parcel) => {
  parcels.forEach((neighbor) => {
    if (
      neighbor.id !== parcel.id &&
      // 🔥 NOTE booleanIntersects returns true if polygons just touch
      turf.intersect(featureCollection([parcel, neighbor]))
    ) {
      console.log(chalk.magenta(`- clipping ${parcel.id} with ${neighbor.id}`));
      // 👉 use the difference
      parcel.geometry = turf.difference(
        featureCollection([parcel, neighbor])
      ).geometry;
    }
  });
});

// ////////////////////////////////////////////////////////////////////
// 👇 update the hash of all parcels with those that have changed
// ////////////////////////////////////////////////////////////////////

parcels.forEach((parcel) => {
  const original = allParcelsByID[parcel.id];
  if (!deepEqual(parcel.geometry.coordinates, original.geometry.coordinates))
    console.log(chalk.white.bold(`- CHANGED ${parcel.id}`));
  const normalized = copy(parcel);
  calculateParcel(normalized);
  allParcelsByID[parcel.id] = normalized;
});

writem(
  "/home/mflo/parcels.geojson",
  simplify(turf.featureCollection(Object.values(allParcelsByID))),
  null
);

// ////////////////////////////////////////////////////////////////////
// 👇 output modified data
// 🔥 colors just for the map viewer
// ////////////////////////////////////////////////////////////////////

writem(
  "/home/mflo/aligned.geojson",
  turf.featureCollection([
    ...lakesides.map(
      (lakeside): Feature => ({
        id: lakeside.lake.id,
        type: "Feature",
        geometry: lakeside.lake.geometry,
        properties: {
          fill: "#0000FF",
          "fill-opacity": 0.25,
          id: lakeside.lake.id,
          stroke: "#0000FF",
          "stroke-width": 1
        }
      })
    ),
    ...parcels.map(
      (parcel): Feature => ({
        id: parcel.id,
        type: "Feature",
        geometry: parcel.geometry,
        properties: {
          fill: "#795548",
          "fill-opacity": 0.1,
          id: parcel.id,
          stroke: "#795548",
          "stroke-width": 3
        }
      })
    ),
    ...roadways.map(
      (roadway): Feature => ({
        id: roadway.road.properties.name,
        type: "Feature",
        geometry: roadway.road.geometry,
        properties: {
          fill: "#00FF00",
          "fill-opacity": 0.75,
          name: roadway.road.properties.name,
          stroke: "#00FF00",
          "stroke-width": 1
        }
      })
    ),
    ...roadways.map(
      (roadway): Feature => ({
        type: "Feature",
        geometry: roadway.leftBorder.geometry,
        properties: {
          fill: "#FFFF00",
          "fill-opacity": 0.25,
          stroke: "#FFFF00",
          "stroke-width": 1
        }
      })
    ),
    ...roadways.map(
      (roadway): Feature => ({
        type: "Feature",
        geometry: roadway.rightBorder.geometry,
        properties: {
          fill: "#00FFFF",
          "fill-opacity": 0.25,
          stroke: "#00FFFF",
          "stroke-width": 1
        }
      })
    ),
    ...debugged.features
  ])
);
