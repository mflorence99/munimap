import { OLAttributionComponent } from './ol-attribution';
import { OLLayerTileComponent } from './ol-layer-tile';

import { environment } from '../environment';

import { AfterContentInit } from '@angular/core';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { ContentChildren } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Input } from '@angular/core';
import { OnInit } from '@angular/core';
import { QueryList } from '@angular/core';

import OLXYZ from 'ol/source/XYZ';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-source-xyz',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLSourceXYZComponent implements AfterContentInit, OnInit {
  @ContentChildren(OLAttributionComponent)
  attributions: QueryList<OLAttributionComponent>;

  @Input() maxZoom: number;

  olXYZ: OLXYZ;

  @Input() url: string;

  constructor(private http: HttpClient, private layer: OLLayerTileComponent) {}

  ngAfterContentInit(): void {
    // 👉 note that we're saying we don't expect
    //    the list of attributions to change
    this.olXYZ.setAttributions(
      this.attributions.map((attribution) => attribution.getAttribution())
    );
  }

  ngOnInit(): void {
    // 👉 we can't follow the normal convention and put this in the
    //    constructor as there few "set" methods
    const parsed = new URL(this.url);
    const encoded = encodeURIComponent(this.url);
    this.olXYZ = new OLXYZ({
      crossOrigin: 'anonymous',
      maxZoom: this.maxZoom,
      url: `${environment.endpoints.proxy}/proxy/${parsed.hostname}?url=${encoded}&x={x}&y={y}&z={z}`
    });
    this.layer.olLayer.setSource(this.olXYZ);
  }
}
