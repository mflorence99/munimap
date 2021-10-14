import { OLInteractionSelectComponent } from './ol-interaction-select';
import { OLLayerVectorComponent } from './ol-layer-vector';

import { AfterContentInit } from '@angular/core';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Optional } from '@angular/core';

import OLStyle from 'ol/style/Style';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-style',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLStyleComponent implements AfterContentInit {
  #styleable: any;

  olStyle: OLStyle;

  constructor(
    @Optional() layer: OLLayerVectorComponent,
    @Optional() select: OLInteractionSelectComponent
  ) {
    // 👇 choose which styleable parent
    this.#styleable = select ?? layer;
    // 👇 build the style
    this.olStyle = new OLStyle({ fill: null, stroke: null, text: null });
  }

  ngAfterContentInit(): void {
    this.#styleable.olStyleable.setStyle(this.olStyle);
  }
}
