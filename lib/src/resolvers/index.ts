import { GeoJSONService } from '../services/geojson';
import { Index } from '../common';

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Resolve } from '@angular/router';

import { inject } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class IndexResolver implements Resolve<Index> {
  #geoJSON = inject(GeoJSONService);

  resolve(): Observable<Index> {
    return this.#geoJSON.loadIndex();
  }
}
