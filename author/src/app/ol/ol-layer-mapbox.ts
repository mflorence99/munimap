import { Mapable } from './ol-mapable';
import { MapableComponent } from './ol-mapable';
import { OLMapComponent } from './ol-map';
import { Params } from '../services/params';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';
import { OnInit } from '@angular/core';

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
  styles: [':host { display: block; visibility: hidden }']
})
export class OLLayerMapboxComponent implements Mapable, OnInit {
  olLayer: OLMapbox;

  @Input() styleUrl: string;

  @Input() set maxZoom(maxZoom: number) {
    this.olLayer.setMaxZoom(maxZoom);
  }

  @Input() set opacity(opacity: number) {
    this.olLayer.setOpacity(opacity);
  }

  constructor(private map: OLMapComponent, private params: Params) {}

  addToMap(): void {
    this.map.olMap.addLayer(this.olLayer);
  }

  ngOnInit(): void {
    // 👉 we can't follow the normal convention and put this in the
    //    constructor as there few "set" methods
    this.olLayer = new OLMapbox({
      accessToken: this.params.mapbox.apiKey,
      declutter: true,
      styleUrl: this.styleUrl
    });
  }
}