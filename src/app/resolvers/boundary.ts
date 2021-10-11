import { GeoJSONService } from '../services/geojson';

import { ActivatedRouteSnapshot } from '@angular/router';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Resolve } from '@angular/router';
import { RouterStateSnapshot } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class BoundaryResolver implements Resolve<GeoJSON.FeatureCollection> {
  constructor(private geoJSON: GeoJSONService) {}

  resolve(
    route: ActivatedRouteSnapshot,
    _state: RouterStateSnapshot
  ): Observable<GeoJSON.FeatureCollection> {
    return this.geoJSON.load(route.parent.data.index.boundary);
  }
}
