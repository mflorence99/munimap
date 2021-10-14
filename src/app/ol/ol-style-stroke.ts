import { OLStyleComponent } from './ol-style';

import * as olColorlike from 'ol/colorlike';

import { AfterContentInit } from '@angular/core';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';

import OLStroke from 'ol/style/Stroke';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-style-stroke',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLStyleStrokeComponent implements AfterContentInit {
  olStroke: OLStroke;

  @Input() set color(color: olColorlike.ColorLike) {
    this.olStroke.setColor(color);
  }

  @Input() set lineDash(lineDash: number[]) {
    this.olStroke.setLineDash(lineDash);
  }

  @Input() set lineDashOffset(lineDashOffset: number) {
    this.olStroke.setLineDashOffset(lineDashOffset);
  }

  @Input() set width(width: number) {
    this.olStroke.setWidth(width);
  }

  constructor(private style: OLStyleComponent) {
    this.olStroke = new OLStroke({ color: null, width: 0 });
  }

  ngAfterContentInit(): void {
    this.style.olStyle.setStroke(this.olStroke);
  }
}
