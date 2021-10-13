import { OLLayerTileComponent } from './ol-layer-tile';

import { AfterContentInit } from '@angular/core';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';

import Colorize from 'ol-ext/filter/Colorize';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-filter-grayscale',
  template: '<ng-content></ng-content>',
  styles: []
})
export class OLFilterGrayscaleComponent implements AfterContentInit {
  olFilter: typeof Colorize;

  constructor(private layer: OLLayerTileComponent) {
    this.olFilter = new Colorize({
      active: true,
      operation: 'hue',
      color: [0, 0, 0],
      value: 1
    });
  }

  ngAfterContentInit(): void {
    // 👇 ol-ext has monkey-patched addFilter
    this.layer.olLayer['addFilter'](this.olFilter);
  }
}
