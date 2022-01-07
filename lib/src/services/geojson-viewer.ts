import { CacheService } from '../services/cache';
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

// 👇 this implementation of GeoJSONService is used by the viewer
//    and only has access to the geojson in one town, as transferred
//    at build time into the assets folder

@Injectable()
export class GeoJSONViewerService extends GeoJSONService {
  constructor(private cache: CacheService, private http: HttpClient) {
    super();
  }

  #load(layerKey: string): Observable<Features> {
    return this.http.get<Features>(`assets/${layerKey}.geojson`).pipe(
      catchError(() => of(emptyFeatures)),
      tap((geojson) => this.cache.set(layerKey, geojson))
    );
  }

  loadByIndex(
    route: ActivatedRoute,
    path: string,
    layerKey: string,
    extent: Coordinate = []
  ): Observable<Features> {
    const cached = this.cache.get(layerKey);
    return (cached ? of(cached) : this.#load(layerKey)).pipe(
      map((geojson) => this.filter(geojson, extent))
    );
  }

  // 👇 we don't need an index for a singular town, so we create a dummy

  loadIndex(): Observable<Index> {
    return of({});
  }
}
