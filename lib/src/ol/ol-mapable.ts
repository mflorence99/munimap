import { Injectable } from '@angular/core';

// 👇 https://sambleckley.com/writing/angular-mixed-type-contentchildren-that-share-an-interface.html

export interface Mapable {
  addToMap(): void;
  mapUpdated?(): void;
}

@Injectable()
export class MapableComponent {}
