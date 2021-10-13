import { OLLayerTileComponent } from './ol-layer-tile';

import { AfterContentInit } from '@angular/core';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';

import PencilSketch from 'ol-ext/filter/PencilSketch';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-filter-pencil',
  template: '<ng-content></ng-content>',
  styles: []
})
export class OLFilterPencilComponent implements AfterContentInit {
  olFilter: typeof PencilSketch;

  constructor(private layer: OLLayerTileComponent) {
    this.olFilter = new PencilSketch();
  }

  ngAfterContentInit(): void {
    // 👇 ol-ext has monkey-patched addFilter
    this.layer.olLayer['addFilter'](this.olFilter);
  }
}
