const jts = require('./jsts.min.js');

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
// 🔥 EXPERIMENTAL - find the vertices of each parcel near the road edge
// ////////////////////////////////////////////////////////////////////

const roadEdgeIntersections = featureCollection([]);

// 👉 for each road ...
roadways.forEach((roadway: Roadway) => {
  const reader = new jts.io.GeoJSONReader();
  const writer = new jts.io.GeoJSONWriter();
  const edges = [roadway.leftEdge, roadway.rightEdge];
  const road = roadway.road;
  console.log(
    chalk.magenta(
      `...... finding parcel intersections with ${road.properties.name} edges`
    )
  );
  // 👉 for each edge ...
  edges.forEach((edge) => {
    const g_road = reader.read(roadway.centerLine.geometry);
    // 👉 for each parcel that intersects with that edge ...
    parcels.forEach((parcel) => {
      const intersections = lineIntersect(edge, parcel);
      if (intersections?.features.length) {
        console.log(
          chalk.cyan(
            `......... ${intersections.features.length} intersections with ${parcel.properties.id}`
          )
        );
        roadEdgeIntersections.features.splice(0, 0, ...intersections.features);
        // 🔥 TEST
        if (parcel.properties.id === '14-167') {
          const g_parcel = reader.read(parcel.geometry);
          const tolerance =
            jts.operation.overlay.snap.GeometrySnapper.computeSizeBasedSnapTolerance(
              g_parcel
            );
          console.log({ tolerance });
          const snapper = new jts.operation.overlay.snap.GeometrySnapper(
            g_road
          );
          const snapped = snapper.snapTo(g_parcel, 0.01);
          const cleaned = jts.operation.overlay.snap.GeometrySnapper.snapToSelf(
            snapped,
            0.01,
            true
          );
          // parcel.geometry = jsome(writer.write(cleaned));
        }
      }
    });
  });
});

// ////////////////////////////////////////////////////////////////////
// 🔥 EXPERIMENTAL
// ////////////////////////////////////////////////////////////////////

// 👉 for each road ...
roadways.forEach((roadway: Roadway) => {
  const road = roadway.road;
  const sides = [roadway.leftSide, roadway.rightSide];
  const width = roadway.width * 4;
  console.log(
    chalk.yellow(`...... expanding parcels to ${road.properties.name} edges`)
  );
  // 👉 for each side ...
  sides.forEach((side) => {
    // 👉 for each parcel that intersects with that side ...
    parcels
      .filter((parcel) => booleanIntersects(parcel, side))
      .forEach((parcel) => {
        const fatso = buffer(parcel, width, { units: 'feet' });
        clipAndDiscard(fatso, road);
        const neighbors = neighborsByParcelID[parcel.properties.id] ?? [];
        neighbors.forEach((neighbor) => {
          try {
            clipAndDiscard(fatso, neighbor);
          } catch (error) {
            console.log(
              `OOOPS ${parcel.properties.id} / ${neighbor.properties.id}`
            );
          }
        });
        // 👉 use the difference
        // parcel.geometry = fatso.geometry;
      });
  });
});

// ////////////////////////////////////////////////////////////////////
// 👇 snap parcels to each neighbor
// ////////////////////////////////////////////////////////////////////

// 👉 for each parcel ...
parcels.forEach((parcel) => {
  const neighbors = snappableParcels[parcel.properties.id];
  console.log(
    chalk.magenta(
      `- snapping ${parcel.properties.id} to neighbors ${neighbors.map(
        (neighbor) => neighbor.properties.id
      )}`
    )
  );
  // 👉 for each neighbor ...
  neighbors.forEach((neighbor) => {
    // 👉 look at each polygon separately
    flattenEach(parcel, (p) => {
      const pp = getCoords(p).at(0);
      flattenEach(neighbor, (q) => {
        const qq = getCoords(q).at(0);
        // 👉 because the coordinates are mutable,
        //    we iterate the old-fashioned way
        for (let ix = 0; ix < pp.length; ix++) {
          for (let iy = 0; iy < qq.length; iy++) {
            const delta = distance(pp[ix], qq[iy], { units: 'feet' });
            // 🔥 just a guess
            // if (delta < 10) pp[ix] = qq[iy];
          }
        }
      });
    });
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
  console.log(chalk.blue(`- expanding parcels to ${road.properties.name}`));
  // 👉 for each roadside edge and side ...
  edges.forEach((edge, ix) => {
    const side = sides.at(ix);
    // 👉 for each expandable parcel that intersects with the outside edge ...
    expandableParcels
      .filter((parcel) => booleanIntersects(parcel, edge))
      .forEach((parcel) => {
        // 👉 we need at least 2 intersections with the outside edge
        const intersections = lineIntersect(parcel, edge);
        iff (intersections.features.length < 2) return;
        // 👉 project a line from the midpoint between the intersections,
        //    through the centerline of the road and out the other side
        const anchor1 = myMidpoint(intersections.features, edge);
        const anchor2 = nearestPointOnLine(centerLine, anchor1);
        const anchor3 = destination(
          anchor2,
          convertLength(roadway.width, 'feet', 'kilometers'),
          bearing(anchor1, anchor2)
        );
        DEBUG(
          parcel,
          [anchor1, anchor2, anchor3],
          ['anchor1', 'anchor2', 'anchor3'],
          '#c2185b'
        );
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
        DEBUG(parcel, tangents, ['tangent', 'tangent'], '#7b1fa2');
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
        DEBUG(parcel, congruents, ['congruent', 'congruent'], '#fbc02d');
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
          console.log(chalk.cyan(`-- expanding ${parcel.properties.id}`));
          parcel.geometry = expanded.geometry;
        }
      });
  });
});

// ////////////////////////////////////////////////////////////////////
// 🔥 EXPERIMENTAL
// ////////////////////////////////////////////////////////////////////

// 👉 for each road ...
roadways.forEach((roadway: Roadway) => {
  [roadway.leftOutsideEdge, roadway.rightInsideEdge].forEach((inside, ix) => {
    const outside = [roadway.leftOutsideEdge, roadway.rightOutsideEdge].at(ix);
    const parcels = [roadway.parcelsOnLeft, roadway.parcelsOnRight].at(ix);
    const length = turf.length(outside, { units: 'feet' });
    let wasOverID = undefined;
    for (let along = 0; along < length; along += 10) {
      const point = turf.along(outside, along, { units: 'feet' });
      const over = parcels.filter((parcel) =>
        turf.booleanPointInPolygon(point, parcel)
      );
      const overID = over.map((p) => p.id).at(0);
      if (overID !== wasOverID) {
        wasOverID = overID;
        console.log(`${roadway.road.properties.name} ${overID}`);
        DEBUG('pts', [point], ['pts'], '#000000');
      }
    }
  });
});
