import { Features } from '../geojson';
import { Index } from '../geojson';

import { emptyFeatures } from '../geojson';

import { ActivatedRoute } from '@angular/router';
import { Coordinate } from 'ol/coordinate';
import { Observable } from 'rxjs';

import bbox from '@turf/bbox';
import copy from 'fast-copy';

export abstract class GeoJSONService {
  filter(geojson: Features, extent: Coordinate): Features {
    const [minX, minY, maxX, maxY] = extent ?? [];
    if (minX && minY && maxX && maxY) {
      const filtered = copy(emptyFeatures);
      filtered.features = geojson.features.filter((feature) => {
        // 👉 some features don't have a bbox, but we prefer
        //    it if present as it is faster
        const [left, bottom, right, top] = feature.bbox ?? bbox(feature);
        // 👉 https://gamedev.stackexchange.com/questions/586
        return !(minX > right || maxX < left || maxY < bottom || minY > top);
      });
      return filtered;
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
  ): Observable<Features>;

  abstract loadIndex(): Observable<Index>;
}
