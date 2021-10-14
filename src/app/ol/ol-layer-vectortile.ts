import { OLMapComponent } from './ol-map';

import { AfterContentInit } from '@angular/core';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';

import OLVectorTile from 'ol/layer/VectorTile';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-layer-vectortile',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLLayerVectorTileComponent implements AfterContentInit {
  olLayer: OLVectorTile;

  constructor(private map: OLMapComponent) {
    this.olLayer = new OLVectorTile({ source: null, style: null });
  }

  ngAfterContentInit(): void {
    this.map.olMap.addLayer(this.olLayer);
  }
}
