import { OLLayerMapboxComponent } from './ol-layer-mapbox';
import { OLLayerTileComponent } from './ol-layer-tile';
import { OLLayerVectorComponent } from './ol-layer-vector';
import { OLLayerVectorTileComponent } from './ol-layer-vectortile';

import { AfterContentInit } from '@angular/core';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';
import { Optional } from '@angular/core';

import Colorize from 'ol-ext/filter/Colorize';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-filter-enhance',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLFilterEnhanceComponent implements AfterContentInit {
  #layer: any;

  olFilter: typeof Colorize;

  @Input() set value(value: number) {
    this.olFilter.setValue(value);
  }

  constructor(
    @Optional() layer1: OLLayerMapboxComponent,
    @Optional() layer2: OLLayerTileComponent,
    @Optional() layer3: OLLayerVectorComponent,
    @Optional() layer4: OLLayerVectorTileComponent
  ) {
    // 👇 choose which layer parent
    this.#layer = layer1 ?? layer2 ?? layer3 ?? layer4;
    // 👇 build the filter
    this.olFilter = new Colorize({ operation: 'enhance', value: 1 });
  }

  ngAfterContentInit(): void {
    // 👇 ol-ext has monkey-patched addFilter
    this.#layer.olLayer['addFilter'](this.olFilter);
  }
}
