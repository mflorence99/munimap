const jts = require('./jsts.min.js');

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
