import { Params } from './params';
import { Path } from '../state/view';
import { ViewState } from '../state/view';

import { environment } from '../../environment';

import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface CountyIndex {
  [town: string]: TownIndex | Record<string, Layer>;
  layers: {
    boundary: Layer;
    selectables: Layer;
    towns: Layer;
  };
}

export interface Index {
  [state: string]: StateIndex;
}

export interface Layer {
  name: string;
  url: string;
}

export interface TownIndex {
  layers: {
    boundary: Layer;
    lakes: Layer;
    parcels: Layer;
    roads: Layer;
    selectables: Layer;
  };
}

export interface StateIndex {
  [county: string]: CountyIndex | Record<string, Layer>;
  layers: {
    boundary: Layer;
    counties: Layer;
    railroads: Layer;
    selectables: Layer;
    towns: Layer;
  };
}

export interface ParcelProperties {
  abutters: string[];
  address: string;
  area: number;
  areaComputed: number;
  building$: number;
  callout: number[];
  center: number[];
  cu$: number;
  elevation: number;
  id: string;
  label: { rotate: boolean; split: boolean };
  land$: number;
  lengths: number[];
  minWidth: number;
  neighborhood: string;
  orientation: number;
  owner: string;
  perimeter: number;
  sqarcity: number;
  taxed$: number;
  usage: string;
  use: string;
  zone: string;
}

export const isIndex = (name: string): boolean => /^[A-Z ]*$/.test(name);

@Injectable({ providedIn: 'root' })
export class GeoJSONService {
  constructor(private http: HttpClient, private params: Params) {}

  #indexFromPath(
    base: Index,
    path: Path
  ): StateIndex | CountyIndex | TownIndex {
    const parts = ViewState.splitPath(path);
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

  load(path: string): Observable<GeoJSON.FeatureCollection<GeoJSON.Polygon>> {
    return this.http.get<GeoJSON.FeatureCollection<GeoJSON.Polygon>>(
      `${this.params.geoJSON.host}${path}`,
      { headers: new HttpHeaders({ cache: String(environment.production) }) }
    );
  }

  loadByIndex(
    route: ActivatedRoute,
    path: string,
    layer: string
  ): Observable<GeoJSON.FeatureCollection<GeoJSON.Polygon>> {
    const base = this.findIndex(route);
    return this.loadFromIndex(base, path, layer);
  }

  loadFromIndex(
    base: Index,
    path: string,
    layer: string
  ): Observable<GeoJSON.FeatureCollection<GeoJSON.Polygon>> {
    const index = this.#indexFromPath(base, path);
    const url = index.layers[layer].url;
    return this.load(url);
  }

  loadIndex(): Observable<Index> {
    return this.http.get<Index>(`${this.params.geoJSON.host}/index.json`, {
      headers: new HttpHeaders({ cache: String(environment.production) })
    });
  }
}
