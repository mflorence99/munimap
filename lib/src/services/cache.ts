import { Injectable } from "@angular/core";

@Injectable({ providedIn: "root" })
export class CacheService {
  #cache = new Map<string, any>();

  get(key: string): any {
    return this.#cache.get(key);
  }

  set(key, features): void {
    this.#cache.set(key, features);
  }
}
