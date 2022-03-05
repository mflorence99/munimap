import { Mapable } from './ol-mapable';
import { MapableComponent } from './ol-mapable';
import { OLMapComponent } from './ol-map';
import { Styler } from './ol-styler';
import { StylerComponent } from './ol-styler';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { ContentChildren } from '@angular/core';
import { Input } from '@angular/core';
import { QueryList } from '@angular/core';
import { StyleFunction as OLStyleFunction } from 'ol/style/Style';

import { forwardRef } from '@angular/core';
import OLStyle from 'ol/style/Style';

import OLVector from 'ol/layer/Vector';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: MapableComponent,
      useExisting: forwardRef(() => OLLayerVectorComponent)
    }
  ],
  selector: 'app-ol-layer-vector',
  template: '<ng-content></ng-content>',
  styles: [':host { display: block; visibility: hidden }']
})
export class OLLayerVectorComponent implements Mapable {
  olLayer: OLVector<any>;

  @ContentChildren(StylerComponent, { descendants: true })
  stylers$: QueryList<any>;

  @Input() set maxZoom(maxZoom: number) {
    this.olLayer.setMaxZoom(maxZoom);
  }

  @Input() set opacity(opacity: number) {
    this.olLayer.setOpacity(opacity);
  }

  constructor(private map: OLMapComponent) {
    this.olLayer = new OLVector({
      source: null,
      style: this.#style()
    });
  }

  #style(): OLStyleFunction {
    return (feature: any, resolution: number): OLStyle[] =>
      this.stylers$
        .map((styler) => styler.style()(feature, resolution))
        .flat()
        .filter((style) => !!style);
  }

  addToMap(): void {
    this.map.olMap.addLayer(this.olLayer);
  }

  styleWhenSelected(): OLStyleFunction {
    return (feature: any, resolution: number): OLStyle[] =>
      this.stylers$
        .map((styler) => styler.styleWhenSelected?.()(feature, resolution))
        .flat()
        .filter((style) => !!style);
  }
}
