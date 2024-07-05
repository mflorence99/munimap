import { Index } from "../common";
import { CacheService } from "../services/cache";
import { GeoJSONService } from "./geojson";

import { environment } from "../environment";

import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Coordinate } from "ol/coordinate";
import { Observable } from "rxjs";

import { inject } from "@angular/core";
import { of } from "rxjs";
import { catchError } from "rxjs/operators";
import { delay } from "rxjs/operators";
import { map } from "rxjs/operators";
import { tap } from "rxjs/operators";

// 👇 this implementation of GeoJSONService is used by the viewer
//    and only has access to the geojson in one town, as transferred
//    at build time into the assets folder

@Injectable()
export class GeoJSONViewerService extends GeoJSONService {
  #cache = inject(CacheService);
  #cacheBuster = {
    version: environment.package.version,
  };
  #http = inject(HttpClient);

  loadByIndex(
    path: string,
    layerKey: string,
    extent: Coordinate = [],
  ): Observable<GeoJSON.FeatureCollection> {
    const cached = this.#cache.get(layerKey);
    return (
      cached
        ? // 👇 preserve "next tick" semantics of HTTP GET
          of(cached).pipe(delay(0))
        : this.#load(layerKey)
    ).pipe(map((geojson) => this.filter(geojson, extent)));
  }

  // 👇 we don't need an index for a singular town, so we create a dummy

  loadIndex(): Observable<Index> {
    return of({}).pipe(tap((index) => (this.index = index)));
  }

  #load(layerKey: string): Observable<GeoJSON.FeatureCollection<any, any>> {
    return this.#http
      .get<GeoJSON.FeatureCollection<any, any>>(`assets/${layerKey}.geojson`, {
        params: this.#cacheBuster,
      })
      .pipe(
        catchError(() => of(this.empty)),
        tap((geojson) => this.#cache.set(layerKey, geojson)),
      );
  }
}
