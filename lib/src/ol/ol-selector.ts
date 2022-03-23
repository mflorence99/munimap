import { Feature } from '../geojson';
import { FeatureID } from '../geojson';

import { EventEmitter } from '@angular/core';
import { Injectable } from '@angular/core';

import OLFeature from 'ol/Feature';

// 👇 https://sambleckley.com/writing/angular-mixed-type-contentchildren-that-share-an-interface.html

export interface Selector {
  abuttersFound?: EventEmitter<Feature[]>;
  featuresSelected: EventEmitter<OLFeature<any>[]>;
  selected: OLFeature<any>[];
  selectedIDs: FeatureID[];
}

@Injectable()
export class SelectorComponent {}