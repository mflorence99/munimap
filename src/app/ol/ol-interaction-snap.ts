import { Mapable } from './ol-mapable';
import { MapableComponent } from './ol-mapable';
import { OLLayerVectorComponent } from './ol-layer-vector';
import { OLMapComponent } from './ol-map';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';

import { forwardRef } from '@angular/core';

import OLSnap from 'ol/interaction/Snap';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: MapableComponent,
      useExisting: forwardRef(() => OLInteractionSnapComponent)
    }
  ],
  selector: 'app-ol-interaction-snap',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none; }']
})
export class OLInteractionSnapComponent implements Mapable {
  olSnap: OLSnap;

  constructor(
    private layer: OLLayerVectorComponent,
    private map: OLMapComponent
  ) {}

  addToMap(): void {
    this.olSnap = new OLSnap({ source: this.layer.olLayer.getSource() });
    this.olSnap.setActive(true);
    this.map.olMap.addInteraction(this.olSnap);
  }
}
