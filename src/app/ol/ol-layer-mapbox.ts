import { OLMapComponent } from './ol-map';
import { Params } from '../services/params';

import { AfterContentInit } from '@angular/core';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';

import OLMapbox from 'ol/layer/MapboxVector';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-layer-mapbox',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLLayerMapboxComponent implements AfterContentInit {
  olLayer: OLMapbox;

  @Input() set styleUrl(url: string) {
    this.olLayer = new OLMapbox({
      accessToken: this.params.mapbox.apiKey,
      declutter: true,
      styleUrl: url
    });
  }

  constructor(private map: OLMapComponent, private params: Params) {
    // 👉 can't follow the normal pattern as no setStyleUrl
  }

  ngAfterContentInit(): void {
    this.map.olMap.addLayer(this.olLayer);
  }
}
