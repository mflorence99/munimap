import { Mapable } from './ol-mapable';
import { MapableComponent } from './ol-mapable';
import { OLMapComponent } from './ol-map';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';

import { effect } from '@angular/core';
import { forwardRef } from '@angular/core';
import { inject } from '@angular/core';
import { input } from '@angular/core';

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
  styles: [':host { display: block; visibility: hidden }'],
  standalone: false
})
export class OLLayerTileComponent implements Mapable {
  id = input<string>();
  maxZoom = input(22);
  olLayer: OLTile<any>;
  opacity = input(1);

  #map = inject(OLMapComponent);

  constructor() {
    this.olLayer = new OLTile();
    this.olLayer.setProperties({ component: this }, true);
    // 👇 side effects
    effect(() => this.olLayer.set('id', this.id()));
    effect(() => this.olLayer.setMaxZoom(this.maxZoom()));
    effect(() => this.olLayer.setOpacity(this.opacity()));
  }

  addToMap(): void {
    this.#map.olMap.addLayer(this.olLayer);
  }
}
