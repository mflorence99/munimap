import { Params } from './params';
import { Path } from '../state/view';

import { environment } from '../../environment';

import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export interface CountyIndex {
  [town: string]: TownIndex | Record<string, Layer>;
  layers: {
    boundary: Layer;
    places: Layer;
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
    places: Layer;
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

export interface LakeProperties {
  county: string;
  name: string;
  town: string;
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
  neighborhood: 'U' | 'V' | 'W';
  orientation: number;
  owner: string;
  perimeter: number;
  sqarcity: number;
  taxed$: number;
  usage: '110' | '120' | '190' | '260' | '300' | '400' | '500' | '501' | '502';
  use: 'CUFL' | 'CUMH' | 'CUMW' | 'CUUH' | 'CUUW' | 'CUWL';
  zone: string;
}

export interface PlacesProperties {
  county: string;
  name: string;
  town: string;
  type:
    | 'airport'
    | 'area'
    | 'bar'
    | 'basin'
    | 'bay'
    | 'beach'
    | 'bench'
    | 'bend'
    | 'bridge'
    | 'building'
    | 'canal'
    | 'cape'
    | 'cave'
    | 'cemetery'
    | 'channel'
    | 'church'
    | 'civil'
    | 'cliff'
    | 'crossing'
    | 'dam'
    | 'falls'
    | 'flat'
    | 'forest'
    | 'gap'
    | 'gut'
    | 'harbor'
    | 'hospital'
    | 'island'
    | 'lake'
    | 'locale'
    | 'military'
    | 'mine'
    | 'other'
    | 'park'
    | 'pillar'
    | 'po'
    | 'ppl'
    | 'range'
    | 'rapids'
    | 'reserve'
    | 'reservoir'
    | 'ridge'
    | 'school'
    | 'sea'
    | 'slope'
    | 'spring'
    | 'stream'
    | 'summit'
    | 'swamp'
    | 'tower'
    | 'trail'
    | 'valley'
    | 'woods';
}

export interface RoadProperties {
  class: 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI' | '0';
  county: string;
  name: string;
  owner: string;
  town: string;
  width: number;
}

export const isIndex = (name: string): boolean => /^[A-Z ]*$/.test(name);

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

  load(path: string): Observable<GeoJSON.FeatureCollection<GeoJSON.Polygon>> {
    return this.http
      .get<GeoJSON.FeatureCollection<GeoJSON.Polygon>>(
        `${this.params.geoJSON.host}${path}`,
        { headers: new HttpHeaders({ cache: String(environment.production) }) }
      )
      .pipe(
        catchError(() =>
          of({
            features: [],
            type: 'FeatureCollection'
          } as GeoJSON.FeatureCollection<GeoJSON.Polygon>)
        )
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
