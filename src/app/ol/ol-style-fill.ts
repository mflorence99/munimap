import { OLStyleComponent } from './ol-style';

import * as olColorlike from 'ol/colorlike';

import { AfterContentInit } from '@angular/core';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';

import OLFill from 'ol/style/Fill';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-style-fill',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLStyleFillComponent implements AfterContentInit {
  olFill: OLFill;

  @Input() set color(color: olColorlike.ColorLike) {
    this.olFill.setColor(color);
  }

  constructor(private style: OLStyleComponent) {
    this.olFill = new OLFill({ color: null });
  }

  ngAfterContentInit(): void {
    this.style.olStyle.setFill(this.olFill);
  }
}
