import { OLLayerTileComponent } from './ol-layer-tile';
import { OLLayerVectorComponent } from './ol-layer-vector';

import { AfterContentInit } from '@angular/core';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { OnDestroy } from '@angular/core';
import { Optional } from '@angular/core';

import PencilSketch from 'ol-ext/filter/PencilSketch';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-filter-pencil',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLFilterPencilComponent implements AfterContentInit, OnDestroy {
  #layer: any;

  olFilter: PencilSketch;

  constructor(
    @Optional() layer1: OLLayerTileComponent,
    @Optional() layer2: OLLayerVectorComponent
  ) {
    // 👇 choose which layer parent
    this.#layer = layer1 ?? layer2;
    // 👇 build the filter
    this.olFilter = new PencilSketch();
  }

  ngAfterContentInit(): void {
    // 👇 ol-ext has monkey-patched addFilter
    this.#layer?.olLayer['addFilter'](this.olFilter);
  }

  ngOnDestroy(): void {
    // 👇 ol-ext has monkey-patched removeFilter
    this.#layer?.olLayer['removeFilter'](this.olFilter);
  }
}
