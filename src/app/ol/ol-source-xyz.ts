import { OLLayerTileComponent } from './ol-layer-tile';

import { AfterContentInit } from '@angular/core';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';

import OLXYZ from 'ol/source/XYZ';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-source-xyz',
  template: '<ng-content></ng-content>',
  styles: []
})
export class OLSourceXYZComponent implements AfterContentInit {
  olXYZ: OLXYZ;

  @Input() set url(url: string) {
    this.olXYZ.setUrl(url);
  }

  constructor(private layer: OLLayerTileComponent) {
    this.olXYZ = new OLXYZ({ url: undefined });
  }

  ngAfterContentInit(): void {
    this.layer.olLayer.setSource(this.olXYZ);
  }
}
