import { OLLayerVectorComponent } from './ol-layer-vector';

import { AfterContentInit } from '@angular/core';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';

import OLFill from 'ol/style/Fill';
import OLStroke from 'ol/style/Stroke';
import OLStyle from 'ol/style/Style';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-style',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLStyleComponent implements AfterContentInit {
  olStyle: OLStyle;

  @Input() set fill(color: any) {
    this.olStyle.setFill(new OLFill({ color }));
  }

  @Input() set stroke(color: any) {
    this.olStyle.setStroke(new OLStroke({ color }));
  }

  constructor(private layer: OLLayerVectorComponent) {
    this.olStyle = new OLStyle({ fill: null, stroke: null });
  }

  ngAfterContentInit(): void {
    this.layer.olLayer.setStyle(this.olStyle);
  }
}
