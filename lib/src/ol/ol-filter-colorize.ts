import { OLLayerMapboxComponent } from './ol-layer-mapbox';
import { OLLayerTileComponent } from './ol-layer-tile';
import { OLLayerVectorComponent } from './ol-layer-vector';
import { OLLayerVectorTileComponent } from './ol-layer-vectortile';

import { AfterContentInit } from '@angular/core';
import { ChangeDetectionStrategy } from '@angular/core';
import { Color } from 'ol/color';
import { Component } from '@angular/core';
import { Input } from '@angular/core';
import { OnDestroy } from '@angular/core';
import { Optional } from '@angular/core';

import Colorize from 'ol-ext/filter/Colorize';

type Operation =
  | 'color-dodge'
  | 'color'
  | 'contrast'
  | 'difference'
  | 'enhance'
  | 'grayscale'
  | 'hue'
  | 'invert'
  | 'luminosity'
  | 'saturation'
  | 'sepia';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-filter-colorize',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLFilterColorizeComponent implements AfterContentInit, OnDestroy {
  #color: Color = [0, 0, 0];
  #layer: any;
  #operation: Operation;
  #value = 1;

  olFilter: typeof Colorize;

  @Input()
  get color(): Color {
    return this.#color;
  }
  set color(color: Color) {
    this.#color = color;
    this.#setFilter();
  }

  @Input()
  get operation(): Operation {
    return this.#operation;
  }
  set operation(operation: Operation) {
    this.#operation = operation;
    this.#setFilter();
  }

  @Input()
  get value(): number {
    return this.#value;
  }
  set value(value: number) {
    this.#value = value;
    this.#setFilter();
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
    this.olFilter = new Colorize({
      active: true
    });
  }

  #setFilter(): void {
    switch (this.operation) {
      case 'grayscale':
      case 'invert':
      case 'sepia':
        this.olFilter.setFilter(this.operation);
        break;
      default:
        this.olFilter.setFilter({
          color: this.color,
          operation: this.operation,
          value: this.value
        });
        break;
    }
  }

  ngAfterContentInit(): void {
    // 👇 ol-ext has monkey-patched addFilter
    this.#layer.olLayer['addFilter'](this.olFilter);
  }

  ngOnDestroy(): void {
    // 👇 ol-ext has monkey-patched removeFilter
    this.#layer.olLayer['removeFilter'](this.olFilter);
  }
}
