import { GeoJSONService } from './geojson';
import { Params } from './params';

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { forkJoin } from 'rxjs';

// 👇 we do this just to get the data pre-cached

export function initializeAppProvider(
  initializer: InitializerService
): Function {
  return (): Observable<any> => initializer.initialize();
}

@Injectable({ providedIn: 'root' })
export class InitializerService {
  constructor(private geoJSON: GeoJSONService, private params: Params) {}

  initialize(): Observable<any> {
    const preload = [this.geoJSON.loadIndex()];
    return forkJoin(preload);
  }
}
