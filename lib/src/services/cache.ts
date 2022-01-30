import { Features } from '../geojson';

import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CacheService {
  #cache = new Map<string, Features>();

  get(key: string): Features {
    return this.#cache.get(key);
  }

  set(key, features): void {
    this.#cache.set(key, features);
  }
}
