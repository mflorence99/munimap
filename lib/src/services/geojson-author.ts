import { CountyIndex } from '../geojson';
import { Features } from '../geojson';
import { GeoJSONService } from './geojson';
import { Index } from '../geojson';
import { Path } from '../state/view';
import { StateIndex } from '../geojson';
import { TownIndex } from '../geojson';

import { emptyFeatures } from '../geojson';
import { environment } from '../environment';

import { ActivatedRoute } from '@angular/router';
import { Coordinate } from 'ol/coordinate';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

// 👇 this implementation of GeoJSONService has access to the entire
//    catalog of geojson data for authoring

@Injectable()
export class GeoJSONAuthorService extends GeoJSONService {
  constructor(private http: HttpClient) {
    super();
  }

  #indexFromPath(
    base: Index,
    path: Path
  ): StateIndex | CountyIndex | TownIndex {
    const parts = path.split(':');
    let index: any = base;
    parts.forEach((part) => (index = index[part]));
    return index;
  }

  #load(path: string, extent: Coordinate = []): Observable<Features> {
    let params = '';
    if (extent.length === 4) {
      // 👉 we're going to quantize the extent to 2DPs
      //    so that we can cache the result
      const minX = (Math.floor(extent[0] * 100) / 100).toFixed(2);
      const minY = (Math.floor(extent[1] * 100) / 100).toFixed(2);
      const maxX = (Math.ceil(extent[2] * 100) / 100).toFixed(2);
      const maxY = (Math.ceil(extent[3] * 100) / 100).toFixed(2);
      params = `?minX=${minX}&minY=${minY}&maxX=${maxX}&maxY=${maxY}`;
    }
    return this.http
      .get<Features>(`${environment.endpoints.proxy}${path}${params}`)
      .pipe(catchError(() => of(emptyFeatures)));
  }

  #loadFromIndex(
    base: Index,
    path: string,
    layerKey: string,
    extent: Coordinate = []
  ): Observable<Features> {
    const index = this.#indexFromPath(base, path);
    const layer = index.layers[layerKey];
    const url = layer.url;
    return layer.available ? this.#load(url, extent) : of(emptyFeatures);
  }

  loadByIndex(
    route: ActivatedRoute,
    path: string,
    layerKey: string,
    extent: Coordinate = []
  ): Observable<Features> {
    const base = this.findIndex(route);
    return this.#loadFromIndex(base, path, layerKey, extent);
  }

  loadIndex(): Observable<Index> {
    return this.http.get<Index>(`${environment.endpoints.proxy}/index.json`);
  }
}
