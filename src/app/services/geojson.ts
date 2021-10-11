import { Params } from './params';

import { HttpClient } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface CountyIndex {
  boundary: string;
  towns: Record<string, TownIndex>;
}

export interface Index {
  boundary: string;
  counties: Record<string, CountyIndex>;
  layers: {
    railroads: Layer;
  };
  towns: string;
}

export interface Layer {
  name: string;
  url: string;
}

export interface TownIndex {
  boundary: string;
  layers: {
    roads: Layer;
  };
}

@Injectable({ providedIn: 'root' })
export class GeoJSONService {
  constructor(private http: HttpClient, private params: Params) {}

  load(path: string): Observable<GeoJSON.FeatureCollection> {
    const headers = new HttpHeaders({ cache: 'true' });
    const url = `${this.params.geoJSON.host}${path}`;
    return this.http.get<GeoJSON.FeatureCollection>(url, { headers });
  }

  loadIndex(): Observable<Index> {
    const headers = new HttpHeaders({ cache: 'true' });
    const url = `${this.params.geoJSON.host}/index.json`;
    return this.http.get<Index>(url, { headers });
  }
}
