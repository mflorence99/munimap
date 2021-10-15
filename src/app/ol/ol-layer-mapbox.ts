import { Mapable } from './ol-mapable';
import { MapableComponent } from './ol-mapable';
import { OLMapComponent } from './ol-map';
import { Params } from '../services/params';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';

import { forwardRef } from '@angular/core';

import OLMapbox from 'ol/layer/MapboxVector';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: MapableComponent,
      useExisting: forwardRef(() => OLLayerMapboxComponent)
    }
  ],
  selector: 'app-ol-layer-mapbox',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLLayerMapboxComponent implements Mapable {
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

  addToMap(): void {
    this.map.olMap.addLayer(this.olLayer);
  }
}
