/* eslint-disable spaced-comment */

/// <reference lib="webworker" />

import * as Comlink from 'comlink';
import * as Sentry from '@sentry/angular';

import buffer from '@turf/buffer';
import intersect from '@turf/intersect';

type Feature = GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>;

const abutterRange = 200; /* 👈 feet */

export class Abutters {
  find(selecteds: Feature[], allFeatures: Feature[]): Feature[] {
    const selectedIDs = selecteds.map((selected) => selected.id);
    const unique = selecteds
      .flatMap((selected) => {
        // 👉 inflate selected feature by N ft all around
        const buffered = buffer(selected, abutterRange, {
          units: 'feet'
        });
        return (
          allFeatures
            // 🔥 try to capture problem where some features appear to have
            //    no geometry after modification
            .filter((feature) => {
              const hasGeometry = feature.geometry?.coordinates;
              if (!hasGeometry)
                Sentry.captureMessage(`${feature.id} has no geometry`);
              return hasGeometry;
            })
            // 👉 match those in range
            .filter(
              (feature) =>
                !selectedIDs.includes(feature.id) &&
                intersect(feature, buffered)
            )
        );
      })
      .reduce((acc, abutter) => {
        acc[abutter.id] = abutter;
        return acc;
      }, {});
    return Object.values(unique);
  }
}

Comlink.expose(Abutters);
