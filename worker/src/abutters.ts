/* eslint-disable spaced-comment */

/// <reference lib="webworker" />

import * as Sentry from "@sentry/angular-ivy";
import * as Comlink from "comlink";

import { buffer } from "@turf/buffer";
import { featureCollection } from "@turf/helpers";
import { intersect } from "@turf/intersect";

type Feature = GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>;

// 👀 https://www.gencourt.state.nh.us/bill_status/pdf.aspx?id=31993&q=billVersion

// 🔥 this algorithm inflates both the selected and the target lot by 50 feeet
//    it is very close to but not exactly what's in the RSA
//    the good news is that it is more ge nerous

const abutterRange = 50; /* 👈 feet */

export class Abutters {
  find(selecteds: Feature[], allFeatures: Feature[]): Feature[] {
    const selectedIDs = selecteds.map((selected) => selected.id);
    const unique = selecteds
      .flatMap((selected) => {
        let buffered: Feature;
        try {
          // 👉 inflate selected feature by N ft all around
          buffered = buffer(selected, abutterRange, {
            units: "feet"
          });
        } catch (e) {
          // 🔥 try to capture problem of invalid geometry
          buffered = selected;
          Sentry.captureMessage(
            `Inflate failed for ${selected.id} ${e.message}`
          );
        }
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
            .filter((feature) => {
              try {
                return (
                  !selectedIDs.includes(feature.id) &&
                  intersect(
                    featureCollection([
                      buffer(feature, abutterRange, {
                        units: "feet"
                      }),
                      buffered
                    ])
                  )
                );
              } catch (e) {
                Sentry.captureMessage(
                  `Intersect failed for ${feature.id} with ${selected.id} ${e.message}`
                );
                return false;
              }
            })
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
