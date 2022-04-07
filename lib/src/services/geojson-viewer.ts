import { CacheService } from '../services/cache';
import { GeoJSONService } from './geojson';
import { Index } from '../common';

import { environment } from '../environment';

import { ActivatedRoute } from '@angular/router';
import { Coordinate } from 'ol/coordinate';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { catchError } from 'rxjs/operators';
import { delay } from 'rxjs/operators';
import { map } from 'rxjs/operators';
import { of } from 'rxjs';
import { tap } from 'rxjs/operators';

// 👇 this implementation of GeoJSONService is used by the viewer
//    and only has access to the geojson in one town, as transferred
//    at build time into the assets folder

@Injectable()
export class GeoJSONViewerService extends GeoJSONService {
  #cacheBuster = {
    version: environment.package.version
  };

  constructor(private cache: CacheService, private http: HttpClient) {
    super();
  }

  #load(layerKey: string): Observable<GeoJSON.FeatureCollection<any, any>> {
    return this.http
      .get<GeoJSON.FeatureCollection<any, any>>(`assets/${layerKey}.geojson`, {
        params: this.#cacheBuster
      })
      .pipe(
        catchError(() => of(this.empty)),
        tap((geojson) => this.cache.set(layerKey, geojson))
      );
  }

  loadByIndex(
    route: ActivatedRoute,
    path: string,
    layerKey: string,
    extent: Coordinate = []
  ): Observable<GeoJSON.FeatureCollection> {
    const cached = this.cache.get(layerKey);
    return (
      cached
        ? // 👇 preserve "next tick" semantics of HTTP GET
          of(cached).pipe(delay(0))
        : this.#load(layerKey)
    ).pipe(map((geojson) => this.filter(geojson, extent)));
  }

  // 👇 we don't need an index for a singular town, so we create a dummy

  loadIndex(): Observable<Index> {
    return of({});
  }
}
