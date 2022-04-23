import { OLLayerVectorComponent } from './ol-layer-vector';

import { EventEmitter } from '@angular/core';
import { Injectable } from '@angular/core';

import OLFeature from 'ol/Feature';

// 👇 https://sambleckley.com/writing/angular-mixed-type-contentchildren-that-share-an-interface.html

export interface Selector {
  abuttersFound?: EventEmitter<any[]>;
  featuresSelected: EventEmitter<OLFeature<any>[]>;
  layer?: OLLayerVectorComponent;
  selected: OLFeature<any>[];
  selectedIDs: any[];
}

@Injectable()
export class SelectorComponent {}
