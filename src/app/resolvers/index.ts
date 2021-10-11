import { GeoJSONService } from '../services/geojson';
import { Index } from '../services/geojson';

import { ActivatedRouteSnapshot } from '@angular/router';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Resolve } from '@angular/router';
import { RouterStateSnapshot } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class IndexResolver implements Resolve<Index> {
  constructor(private geoJSON: GeoJSONService) {}

  resolve(
    _route: ActivatedRouteSnapshot,
    _state: RouterStateSnapshot
  ): Observable<Index> {
    return this.geoJSON.loadIndex();
  }
}
