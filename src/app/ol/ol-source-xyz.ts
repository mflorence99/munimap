import { OLAttributionComponent } from './ol-attribution';
import { OLLayerTileComponent } from './ol-layer-tile';

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
    this.olXYZ.setUrl(url);
  }

  constructor(private layer: OLLayerTileComponent) {
    this.olXYZ = new OLXYZ({ url: null });
  }

  ngAfterContentInit(): void {
    // 👉 note that we'rew saying we don't expect
    //    the list of attributions to change
    this.olXYZ.setAttributions(
      this.attributions.map((attribution) => attribution.getAttribution())
    );
    this.layer.olLayer.setSource(this.olXYZ);
  }
}
