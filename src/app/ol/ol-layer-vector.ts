import { OLMapComponent } from './ol-map';

import { AfterContentInit } from '@angular/core';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';
import { StyleFunction as OLStyleFunction } from 'ol/style/Style';

import OLVector from 'ol/layer/Vector';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-layer-vector',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLLayerVectorComponent implements AfterContentInit {
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

  ngAfterContentInit(): void {
    this.map.olMap.addLayer(this.olLayer);
  }
}
