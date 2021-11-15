import { OLLayerImageComponent } from './ol-layer-image';
import { OLLayerMapboxComponent } from './ol-layer-mapbox';
import { OLLayerTileComponent } from './ol-layer-tile';
import { OLLayerVectorComponent } from './ol-layer-vector';
import { OLLayerVectorTileComponent } from './ol-layer-vectortile';

import { AfterContentInit } from '@angular/core';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Optional } from '@angular/core';

import Colorize from 'ol-ext/filter/Colorize';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-filter-grayscale',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLFilterGrayscaleComponent implements AfterContentInit {
  #layer: any;

  olFilter: typeof Colorize;

  constructor(
    @Optional() layer1: OLLayerImageComponent,
    @Optional() layer2: OLLayerMapboxComponent,
    @Optional() layer3: OLLayerTileComponent,
    @Optional() layer4: OLLayerVectorComponent,
    @Optional() layer5: OLLayerVectorTileComponent
  ) {
    // 👇 choose which layer parent
    this.#layer = layer1 ?? layer2 ?? layer3 ?? layer4 ?? layer5;
    // 👇 build the filter
    this.olFilter = new Colorize({
      active: true,
      operation: 'hue',
      color: [0, 0, 0],
      value: 1
    });
  }

  ngAfterContentInit(): void {
    // 👇 ol-ext has monkey-patched addFilter
    this.#layer.olLayer['addFilter'](this.olFilter);
  }
}
