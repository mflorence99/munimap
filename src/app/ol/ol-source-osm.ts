import { OLLayerTileComponent } from './ol-layer-tile';

import { AfterContentInit } from '@angular/core';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';

import OLOSM from 'ol/source/OSM';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-source-osm',
  template: '<ng-content></ng-content>',
  styles: []
})
export class OLSourceOSMComponent implements AfterContentInit {
  olOSM: OLOSM;

  constructor(private layer: OLLayerTileComponent) {
    this.olOSM = new OLOSM();
  }

  ngAfterContentInit(): void {
    this.layer.olLayer.setSource(this.olOSM);
  }
}
