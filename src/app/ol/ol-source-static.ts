import { OLLayerImageComponent } from './ol-layer-image';
import { OLMapComponent } from './ol-map';

import { AfterContentInit } from '@angular/core';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';

import { transformExtent } from 'ol/proj';

import OLStatic from 'ol/source/ImageStatic';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-source-static',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLSourceStaticComponent implements AfterContentInit {
  olStatic: OLStatic;

  @Input() set url(url: string) {
    const bbox = this.map.boundary.features[0].bbox;
    // 👉 TODO: ambient typings missing this
    const featureProjection = this.map.boundary['crs'].properties.name;
    this.olStatic = new OLStatic({
      imageExtent: transformExtent(
        bbox,
        featureProjection,
        this.map.projection
      ),
      url
    });
  }

  constructor(
    private layer: OLLayerImageComponent,
    private map: OLMapComponent
  ) {
    // 👉 can't follow the normal pattern as no setStyleUrl
  }

  ngAfterContentInit(): void {
    this.layer.olLayer.setSource(this.olStatic);
  }
}
