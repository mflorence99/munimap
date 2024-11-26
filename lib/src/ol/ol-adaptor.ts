import { LandmarkProperties } from '../common';

import { Injectable } from '@angular/core';

import OLFeature from 'ol/Feature';
import OLStyle from 'ol/style/Style';

// 👇 https://sambleckley.com/writing/angular-mixed-type-contentchildren-that-share-an-interface.html

export interface Adaptor {
  adapt(source: any): LandmarkProperties[];
  adaptWhenHovering?(source: any): LandmarkProperties[];
  adaptWhenSelected?(source: any): LandmarkProperties[];
  backdoor?(feature: OLFeature<any>, resolution: number): OLStyle[];
}

@Injectable()
export class AdaptorComponent {}
