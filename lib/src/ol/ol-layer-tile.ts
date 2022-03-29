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
  @Input() autoRefresh = false;

  olLayer: OLTile<any>;

  @Input() set maxZoom(maxZoom: number) {
    this.olLayer.setMaxZoom(maxZoom);
  }

  @Input() set opacity(opacity: number) {
    this.olLayer.setOpacity(opacity);
  }

  constructor(private map: OLMapComponent) {
    this.olLayer = new OLTile({ source: null });
  }

  addToMap(): void {
    this.map.olMap.addLayer(this.olLayer);
    if (this.autoRefresh) this.olLayer.getSource()?.refresh();
  }
}
