import { Index } from '../geojson';

import { ActivatedRoute } from '@angular/router';
import { Coordinate } from 'ol/coordinate';
import { Observable } from 'rxjs';

export abstract class GeoJSONService {
  static empty: GeoJSON.FeatureCollection = {
    features: [],
    type: 'FeatureCollection'
  };

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
  ): Observable<GeoJSON.FeatureCollection>;

  abstract loadIndex(): Observable<Index>;
}
