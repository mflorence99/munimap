import { Index } from '../common';

import { ActivatedRoute } from '@angular/router';
import { Coordinate } from 'ol/coordinate';
import { Observable } from 'rxjs';

import bbox from '@turf/bbox';

export abstract class GeoJSONService {
  empty: GeoJSON.FeatureCollection<any, any> = {
    features: [],
    type: 'FeatureCollection'
  };

  filter(
    geojson: GeoJSON.FeatureCollection<any, any>,
    extent: Coordinate
  ): GeoJSON.FeatureCollection<any, any> {
    const [minX, minY, maxX, maxY] = extent ?? [];
    if (minX && minY && maxX && maxY) {
      return {
        features: geojson.features.filter((feature) => {
          // 👉 some features don't have a bbox, but we prefer
          //    it if present as it is faster
          const [left, bottom, right, top] = feature.bbox ?? bbox(feature);
          // 👉 https://gamedev.stackexchange.com/questions/586
          return !(minX > right || maxX < left || maxY < bottom || minY > top);
        }),
        type: 'FeatureCollection'
      };
    } else return geojson;
  }

  findIndex(route: ActivatedRoute): Index {
    let index;
    do {
      index = route.snapshot.data.index;
      route = route.parent;
    } while (!index);
    return index;
  }

  abstract loadByIndex(
    route: ActivatedRoute,
    path: string,
    layerKey: string,
    extent?: Coordinate
  ): Observable<GeoJSON.FeatureCollection<any, any>>;

  abstract loadIndex(): Observable<Index>;
}
