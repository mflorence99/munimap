import { OLLayerTileComponent } from './ol-layer-tile';

import { AfterContentInit } from '@angular/core';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';

import Colorize from 'ol-ext/filter/Colorize';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-filter-enhance',
  template: '<ng-content></ng-content>',
  styles: []
})
export class OLFilterEnhanceComponent implements AfterContentInit {
  olFilter: typeof Colorize;

  @Input() set value(value: number) {
    this.olFilter.setValue(value);
  }

  constructor(private layer: OLLayerTileComponent) {
    this.olFilter = new Colorize({ operation: 'enhance', value: 1 });
  }

  ngAfterContentInit(): void {
    // 👇 ol-ext has monkey-patched addFilter
    this.layer.olLayer['addFilter'](this.olFilter);
  }
}
