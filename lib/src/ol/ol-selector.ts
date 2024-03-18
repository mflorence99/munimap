import { OLLayerVectorComponent } from './ol-layer-vector';

import { Injectable } from '@angular/core';
import { OutputEmitterRef } from '@angular/core';

import OLFeature from 'ol/Feature';

// 👇 https://sambleckley.com/writing/angular-mixed-type-contentchildren-that-share-an-interface.html

export interface Selector {
  abuttersFound?: OutputEmitterRef<any[]>;
  featuresSelected?: OutputEmitterRef<OLFeature<any>[]>;
  layer?: OLLayerVectorComponent;
  roSelection?: boolean;
  selected?: OLFeature<any>[];
  selectedIDs?: any[];
}

@Injectable()
export class SelectorComponent implements Selector {}
