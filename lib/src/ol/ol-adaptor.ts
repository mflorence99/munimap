import { LandmarkProperties } from '../common';

import { Injectable } from '@angular/core';

// 👇 https://sambleckley.com/writing/angular-mixed-type-contentchildren-that-share-an-interface.html

export interface Adaptor {
  adapt(source: any): LandmarkProperties[];
  adaptWhenSelected?(source: any): LandmarkProperties[];
}

@Injectable()
export class AdaptorComponent {}
