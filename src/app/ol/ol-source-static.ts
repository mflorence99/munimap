import { OLAttributionComponent } from './ol-attribution';
import { OLLayerImageComponent } from './ol-layer-image';
import { OLMapComponent } from './ol-map';

import { AfterContentInit } from '@angular/core';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { ContentChildren } from '@angular/core';
import { Input } from '@angular/core';
import { QueryList } from '@angular/core';

import OLStatic from 'ol/source/ImageStatic';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-source-static',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLSourceStaticComponent implements AfterContentInit {
  @ContentChildren(OLAttributionComponent)
  attributions: QueryList<OLAttributionComponent>;

  olStatic: OLStatic;

  @Input() set url(url: string) {
    this.olStatic = new OLStatic({
      imageExtent: this.map.boundaryExtent,
      url
    });
  }

  constructor(
    private layer: OLLayerImageComponent,
    private map: OLMapComponent
  ) {
    // 👉 can't follow the normal pattern as no setUrl
  }

  ngAfterContentInit(): void {
    // 👉 note that we're saying we don't expect
    //    the list of attributions to change
    this.olStatic.setAttributions(
      this.attributions.map((attribution) => attribution.getAttribution())
    );
    this.layer.olLayer.setSource(this.olStatic);
  }
}
