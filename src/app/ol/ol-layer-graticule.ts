import { Mapable } from './ol-mapable';
import { MapableComponent } from './ol-mapable';
import { OLMapComponent } from './ol-map';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';

import { forwardRef } from '@angular/core';

import OLGraticule from 'ol/layer/Graticule';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: MapableComponent,
      useExisting: forwardRef(() => OLLayerGraticuleComponent)
    }
  ],
  selector: 'app-ol-layer-graticule',
  template: '<ng-content></ng-content>',
  styles: [':host { display: block; visibility: hidden }']
})
export class OLLayerGraticuleComponent implements Mapable {
  olLayer: OLGraticule;

  @Input() set maxZoom(maxZoom: number) {
    this.olLayer.setMaxZoom(maxZoom);
  }

  @Input() set opacity(opacity: number) {
    this.olLayer.setOpacity(opacity);
  }

  constructor(private map: OLMapComponent) {
    this.olLayer = new OLGraticule({
      showLabels: true
    });
  }

  addToMap(): void {
    this.map.olMap.addLayer(this.olLayer);
  }
}
