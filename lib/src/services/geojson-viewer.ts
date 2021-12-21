import { Features } from '../geojson';
import { GeoJSONService } from './geojson';
import { Index } from '../geojson';

import { emptyFeatures } from '../geojson';

import { ActivatedRoute } from '@angular/router';
import { Coordinate } from 'ol/coordinate';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { catchError } from 'rxjs/operators';
import { map } from 'rxjs/operators';
import { of } from 'rxjs';
import { tap } from 'rxjs/operators';

import bbox from '@turf/bbox';
import copy from 'fast-copy';

// 👇 this implementation of GeoJSONService is used by the viewer
//    and only has access to the geojson in one town, as transferred
//    at build time into the assets folder

@Injectable()
export class GeoJSONViewerService extends GeoJSONService {
  #cache: Record<string, Features> = {};

  constructor(private http: HttpClient) {
    super();
  }

  #filter(geojson: Features, extent: Coordinate): Features {
    const [minX, minY, maxX, maxY] = extent;
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

  #load(layerKey: string): Observable<Features> {
    return this.http.get<Features>(`assets/${layerKey}.geojson`).pipe(
      catchError(() => of(emptyFeatures)),
      tap((geojson) => (this.#cache[layerKey] = geojson))
    );
  }

  loadByIndex(
    route: ActivatedRoute,
    path: string,
    layerKey: string,
    extent: Coordinate = []
  ): Observable<Features> {
    const cached = this.#cache[layerKey];
    return (cached ? of(cached) : this.#load(layerKey)).pipe(
      map((geojson) => this.#filter(geojson, extent))
    );
  }

  // 👇 we don't need an index for a singular town, so we create a dummy

  loadIndex(): Observable<Index> {
    return of({});
  }
}
