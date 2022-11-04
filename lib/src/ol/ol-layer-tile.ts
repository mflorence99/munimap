import { Mapable } from './ol-mapable';
import { MapableComponent } from './ol-mapable';
import { OLMapComponent } from './ol-map';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';

import { forwardRef } from '@angular/core';

import OLTile from 'ol/layer/Tile';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: MapableComponent,
      useExisting: forwardRef(() => OLLayerTileComponent)
    }
  ],
  selector: 'app-ol-layer-tile',
  template: '<ng-content></ng-content>',
  styles: [':host { display: block; visibility: hidden }']
})
export class OLLayerTileComponent implements Mapable {
  olLayer: OLTile<any>;

  @Input() set id(id: string) {
    this.olLayer.set('id', id);
  }

  @Input() set maxZoom(maxZoom: number) {
    this.olLayer.setMaxZoom(maxZoom);
  }

  @Input() set opacity(opacity: number) {
    this.olLayer.setOpacity(opacity);
  }

  constructor(private map: OLMapComponent) {
    this.olLayer = new OLTile();
    this.olLayer.setProperties({ component: this }, true);
  }

  addToMap(): void {
    this.map.olMap.addLayer(this.olLayer);
  }
}
