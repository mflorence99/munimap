import { OLLayerTileComponent } from './ol-layer-tile';
import { OLMapComponent } from './ol-map';
import { OLTileSourceComponent } from './ol-source';

import { AfterContentInit } from '@angular/core';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';

import OLOSM from 'ol/source/OSM';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-source-osm',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLSourceOSMComponent
  extends OLTileSourceComponent
  implements AfterContentInit
{
  olSource: OLOSM;

  constructor(
    private layer: OLLayerTileComponent,
    protected map: OLMapComponent
  ) {
    super(map);
    this.olSource = new OLOSM();
  }

  ngAfterContentInit(): void {
    this.layer.olLayer.setSource(this.olSource);
  }
}
