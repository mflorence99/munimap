import { OLMapComponent } from './ol-map';

import { AfterContentInit } from '@angular/core';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';

import OLTile from 'ol/layer/Tile';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-layer-tile',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLLayerTileComponent implements AfterContentInit {
  olLayer: OLTile<any>;

  @Input() set opacity(opacity: number) {
    this.olLayer.setOpacity(opacity);
  }

  constructor(private map: OLMapComponent) {
    this.olLayer = new OLTile({ source: undefined });
  }

  ngAfterContentInit(): void {
    this.map.olMap.addLayer(this.olLayer);
  }
}
