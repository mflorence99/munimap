import { Mapable } from './ol-mapable';
import { MapableComponent } from './ol-mapable';
import { OLMapComponent } from './ol-map';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';

import { forwardRef } from '@angular/core';

import OLVectorTile from 'ol/layer/VectorTile';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: MapableComponent,
      useExisting: forwardRef(() => OLLayerVectorTileComponent)
    }
  ],
  selector: 'app-ol-layer-vectortile',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLLayerVectorTileComponent implements Mapable {
  olLayer: OLVectorTile;

  constructor(private map: OLMapComponent) {
    this.olLayer = new OLVectorTile({ source: null, style: null });
  }

  addToMap(): void {
    this.map.olMap.addLayer(this.olLayer);
  }
}
