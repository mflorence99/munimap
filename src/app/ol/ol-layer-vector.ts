import { OLMapComponent } from './ol-map';

import { AfterContentInit } from '@angular/core';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';

import OLVector from 'ol/layer/Vector';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-layer-vector',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLLayerVectorComponent implements AfterContentInit {
  olLayer: OLVector<any>;

  constructor(private map: OLMapComponent) {
    this.olLayer = new OLVector({ source: undefined, style: undefined });
  }

  ngAfterContentInit(): void {
    this.map.olMap.addLayer(this.olLayer);
  }
}
