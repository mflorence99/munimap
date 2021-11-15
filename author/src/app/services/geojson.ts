import { Params } from './params';
import { Path } from '../state/view';

import { ActivatedRoute } from '@angular/router';
import { CountyIndex } from '@lib/geojson';
import { HttpClient } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';
import { Index } from '@lib/geojson';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { StateIndex } from '@lib/geojson';
import { TownIndex } from '@lib/geojson';

import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

const EMPTY: GeoJSON.FeatureCollection<GeoJSON.Polygon> = {
  features: [],
  type: 'FeatureCollection'
};

@Injectable({ providedIn: 'root' })
export class GeoJSONService {
  constructor(private http: HttpClient, private params: Params) {}

  #indexFromPath(
    base: Index,
    path: Path
  ): StateIndex | CountyIndex | TownIndex {
    const parts = path.split(':');
    let index: any = base;
    parts.forEach((part) => (index = index[part]));
    return index;
  }

  findIndex(route: ActivatedRoute): Index {
    let index;
    do {
      index = route.snapshot.data.index;
      route = route.parent;
    } while (!index);
    return index;
  }

  load(
    path: string,
    extent: number[] = []
  ): Observable<GeoJSON.FeatureCollection<GeoJSON.Polygon>> {
    let params = '';
    if (extent.length === 4) {
      const [minX, minY, maxX, maxY] = extent;
      params = `?minX=${minX}&minY=${minY}&maxX=${maxX}&maxY=${maxY}`;
    }
    return this.http
      .get<GeoJSON.FeatureCollection<GeoJSON.Polygon>>(
        `${this.params.geoJSON.host}${path}${params}`,
        { headers: new HttpHeaders({ cache: 'page' }) }
      )
      .pipe(catchError(() => of(EMPTY)));
  }

  loadByIndex(
    route: ActivatedRoute,
    path: string,
    layerKey: string,
    extent: number[] = []
  ): Observable<GeoJSON.FeatureCollection<GeoJSON.Polygon>> {
    const base = this.findIndex(route);
    return this.loadFromIndex(base, path, layerKey, extent);
  }

  loadFromIndex(
    base: Index,
    path: string,
    layerKey: string,
    extent: number[] = []
  ): Observable<GeoJSON.FeatureCollection<GeoJSON.Polygon>> {
    const index = this.#indexFromPath(base, path);
    const layer = index.layers[layerKey];
    const url = layer.url;
    return layer.available ? this.load(url, extent) : of(EMPTY);
  }

  loadIndex(): Observable<Index> {
    return this.http.get<Index>(`${this.params.geoJSON.host}/index.json`, {
      headers: new HttpHeaders({ cache: 'perm' })
    });
  }
}
