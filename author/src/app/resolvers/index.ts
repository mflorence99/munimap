import { GeoJSONService } from '../services/geojson';

import { Index } from '@lib/geojson';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Resolve } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class IndexResolver implements Resolve<Index> {
  constructor(private geoJSON: GeoJSONService) {}

  resolve(): Observable<Index> {
    return this.geoJSON.loadIndex();
  }
}
