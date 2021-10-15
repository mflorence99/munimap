import { Mapable } from './ol-mapable';
import { MapableComponent } from './ol-mapable';
import { OLMapComponent } from './ol-map';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';
import { StyleFunction as OLStyleFunction } from 'ol/style/Style';

import { forwardRef } from '@angular/core';

import OLVector from 'ol/layer/Vector';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: MapableComponent,
      useExisting: forwardRef(() => OLLayerVectorComponent)
    }
  ],
  selector: 'app-ol-layer-vector',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLLayerVectorComponent implements Mapable {
  olLayer: OLVector<any>;
  olStyleable: OLVector<any>;

  // 👇 if this is used, declarative styles can't be
  @Input() set styler(styler: OLStyleFunction) {
    this.olLayer.setStyle(styler);
  }

  constructor(private map: OLMapComponent) {
    this.olLayer = new OLVector({ declutter: true, source: null, style: null });
    this.olStyleable = this.olLayer;
  }

  addToMap(): void {
    this.map.olMap.addLayer(this.olLayer);
  }
}
