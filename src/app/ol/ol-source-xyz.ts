import { OLAttributionComponent } from './ol-attribution';
import { OLLayerTileComponent } from './ol-layer-tile';
import { Params } from '../services/params';

import { AfterContentInit } from '@angular/core';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { ContentChildren } from '@angular/core';
import { Input } from '@angular/core';
import { QueryList } from '@angular/core';

import OLXYZ from 'ol/source/XYZ';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-source-xyz',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLSourceXYZComponent implements AfterContentInit {
  @ContentChildren(OLAttributionComponent)
  attributions: QueryList<OLAttributionComponent>;

  olXYZ: OLXYZ;

  @Input() set url(url: string) {
    const encoded = encodeURIComponent(url);
    this.olXYZ.setUrl(
      `${this.params.geoJSON.host}/proxy?url=${encoded}&x={x}&y={y}&z={z}`
    );
  }

  constructor(private layer: OLLayerTileComponent, private params: Params) {
    this.olXYZ = new OLXYZ({ crossOrigin: 'anonymous' });
  }

  ngAfterContentInit(): void {
    // 👉 note that we're saying we don't expect
    //    the list of attributions to change
    this.olXYZ.setAttributions(
      this.attributions.map((attribution) => attribution.getAttribution())
    );
    this.layer.olLayer.setSource(this.olXYZ);
  }
}
