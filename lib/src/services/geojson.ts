import { CountyIndex } from '../geojson';
import { Index } from '../geojson';
import { Path } from '../state/view';
import { StateIndex } from '../geojson';
import { TownIndex } from '../geojson';

import { environment } from '../environment';

import { ActivatedRoute } from '@angular/router';
import { Coordinate } from 'ol/coordinate';
import { HttpClient } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

const EMPTY: GeoJSON.FeatureCollection<GeoJSON.Polygon> = {
  features: [],
  type: 'FeatureCollection'
};

@Injectable({ providedIn: 'root' })
export class GeoJSONService {
  constructor(private http: HttpClient) {}

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
    extent: Coordinate = []
  ): Observable<GeoJSON.FeatureCollection<GeoJSON.Polygon>> {
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
      .get<GeoJSON.FeatureCollection<GeoJSON.Polygon>>(
        `${environment.endpoints.proxy}${path}${params}`,
        { headers: new HttpHeaders({ cache: 'page' }) }
      )
      .pipe(catchError(() => of(EMPTY)));
  }

  loadByIndex(
    route: ActivatedRoute,
    path: string,
    layerKey: string,
    extent: Coordinate = []
  ): Observable<GeoJSON.FeatureCollection<GeoJSON.Polygon>> {
    const base = this.findIndex(route);
    return this.loadFromIndex(base, path, layerKey, extent);
  }

  loadFromIndex(
    base: Index,
    path: string,
    layerKey: string,
    extent: Coordinate = []
  ): Observable<GeoJSON.FeatureCollection<GeoJSON.Polygon>> {
    const index = this.#indexFromPath(base, path);
    const layer = index.layers[layerKey];
    const url = layer.url;
    return layer.available ? this.load(url, extent) : of(EMPTY);
  }

  loadIndex(): Observable<Index> {
    return this.http.get<Index>(`${environment.endpoints.proxy}/index.json`, {
      headers: new HttpHeaders({ cache: 'perm' })
    });
  }
}
