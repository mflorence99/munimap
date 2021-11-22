/* eslint-disable spaced-comment */

/// <reference lib="webworker" />

import * as Comlink from 'comlink';

import buffer from '@turf/buffer';
import intersect from '@turf/intersect';

type Feature = GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>;

const abutterRange = 200; /* 👈 feet */

export class Abutters {
  find(selecteds: Feature[], allFeatures: Feature[]): Feature[] {
    const selectedIDs = selecteds.map((selected) => selected.id);
    const unique = selecteds
      .flatMap((selected) => {
        const buffered = buffer(selected, abutterRange / 5280, {
          units: 'miles'
        });
        console.log({ id: selected.id });
        return allFeatures.filter(
          (feature) =>
            !selectedIDs.includes(feature.id) && intersect(feature, buffered)
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
