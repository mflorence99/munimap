import { OLLayerVectorComponent } from './ol-layer-vector';
import { ParcelID } from '../geojson';

import { EventEmitter } from '@angular/core';
import { Injectable } from '@angular/core';

import OLFeature from 'ol/Feature';
import OLSelect from 'ol/interaction/Select';

export interface Selector {
  featuresSelected: EventEmitter<OLFeature<any>[]>;
  layer: OLLayerVectorComponent;
  olSelect: OLSelect;
  selected: OLFeature<any>[];
  selectedIDs: ParcelID[];
}

@Injectable()
export class SelectorComponent {}
