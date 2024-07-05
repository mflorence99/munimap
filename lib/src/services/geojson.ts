import { Index } from "../common";

import { Coordinate } from "ol/coordinate";
import { Observable } from "rxjs";

import { bbox } from "@turf/bbox";
import { featureCollection } from "@turf/helpers";

export abstract class GeoJSONService {
  empty = featureCollection([]);
  index: Index;

  filter(
    geojson: GeoJSON.FeatureCollection<any, any>,
    extent: Coordinate,
  ): GeoJSON.FeatureCollection<any, any> {
    const [minX, minY, maxX, maxY] = extent ?? [];
    if (minX && minY && maxX && maxY) {
      return featureCollection(
        geojson.features.filter((feature) => {
          // 👉 some features don't have a bbox, but we prefer
          //    it if present as it is faster
          const [left, bottom, right, top] = feature.bbox ?? bbox(feature);
          // 👉 https://gamedev.stackexchange.com/questions/586
          return !(minX > right || maxX < left || maxY < bottom || minY > top);
        }),
      );
    } else return geojson;
  }

  findIndex(): Index {
    // 👇 IndexResolver makes sure this happens before we get started
    return this.index;
  }

  abstract loadByIndex(
    path: string,
    layerKey: string,
    extent?: Coordinate,
  ): Observable<GeoJSON.FeatureCollection<any, any>>;

  abstract loadIndex(): Observable<Index>;
}
