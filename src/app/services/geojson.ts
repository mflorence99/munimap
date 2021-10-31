import { Params } from './params';
import { Path } from '../state/view';

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
    selectables: Layer;
    towns: Layer;
  };
}

export interface Index {
  [state: string]: StateIndex;
}

export interface Layer {
  available: boolean;
  name: string;
  url: string;
}

export interface TownIndex {
  layers: {
    boundary: Layer;
    buildings: Layer;
    lakes: Layer;
    parcels: Layer;
    places: Layer;
    powerlines: Layer;
    rivers: Layer;
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

export interface PlaceProperties {
  county: string;
  name: string;
  town: string;
  type: PlacePropertiesType;
}

export type PlacePropertiesType =
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

export interface PowerlineProperties {
  county: string;
  town: string;
}

export interface RiverProperties {
  county: string;
  name: string;
  section: string;
  town: string;
}

export interface RoadProperties {
  class: RoadPropertiesClass;
  county: string;
  name: string;
  owner: string;
  town: string;
  width: number;
}

export type RoadPropertiesClass = 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI' | '0';

export interface TrailProperties {
  county: string;
  name: string;
  system: string;
  town: string;
}

export const isIndex = (name: string): boolean => /^[A-Z ]*$/.test(name);

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
