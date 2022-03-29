import { Mapable } from './ol-mapable';
import { MapableComponent } from './ol-mapable';
import { OLMapComponent } from './ol-map';

import { environment } from '../environment';

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
  @Input() autoRefresh = false;

  @Input() maxZoom: number;

  olLayer: OLMapbox;

  @Input() opacity: number;

  @Input() styleUrl: string;

  constructor(private map: OLMapComponent) {}

  addToMap(): void {
    this.map.olMap.addLayer(this.olLayer);
    if (this.autoRefresh) this.olLayer.getSource()?.refresh();
  }

  ngOnInit(): void {
    // 👉 we can't follow the normal convention and put this in the
    //    constructor as there few "set" methods
    this.olLayer = new OLMapbox({
      accessToken: environment.mapbox.apiKey,
      declutter: true,
      maxZoom: this.maxZoom,
      opacity: this.opacity,
      styleUrl: this.styleUrl
    });
  }
}
