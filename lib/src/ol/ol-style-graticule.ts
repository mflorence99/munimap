import { OLControlGraticuleComponent } from './ol-control-graticule';
import { OLMapComponent } from './ol-map';
import { Styler } from './ol-styler';
import { StylerComponent } from './ol-styler';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';
import { OnInit } from '@angular/core';

import { forwardRef } from '@angular/core';

import OLFill from 'ol/style/Fill';
import OLStroke from 'ol/style/Stroke';
import OLStyle from 'ol/style/Style';
import OLText from 'ol/style/Text';

// 👇 styles ol-ext/control/graticule

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: StylerComponent,
      useExisting: forwardRef(() => OLStyleGraticuleComponent)
    }
  ],
  selector: 'app-ol-style-graticule',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLStyleGraticuleComponent implements Styler, OnInit {
  @Input() fontFamily = 'Roboto';
  @Input() fontSize = 8;
  @Input() fontWeight: 'bold' | 'normal' = 'normal';
  @Input() lineDash = [2, 2];
  @Input() lineWidth = 0.25;

  constructor(
    private control: OLControlGraticuleComponent,
    private map: OLMapComponent
  ) {}

  #border(): OLFill {
    // 👉 this is the part ofthe border that isn't the same
    //    color as the lines
    const color = this.map.vars['--map-graticule-border-color'];
    return new OLFill({ color: `rgba(${color}, 1)` });
  }

  #coords(): OLText {
    const color = this.map.vars['--map-graticule-text-color'];
    const outline = this.map.vars['--map-graticule-text-inverse'];
    return new OLText({
      font: `${this.fontWeight} ${this.fontSize}px '${this.fontFamily}'`,
      fill: new OLFill({ color: `rgba(${color}, 1)` }),
      stroke: new OLStroke({
        color: `rgba(${outline}, 2)`,
        width: 1
      })
    });
  }

  #line(): OLStroke {
    const color = this.map.vars['--map-graticule-line-color'];
    return new OLStroke({
      color: `rgba(${color},  1)`,
      lineCap: 'square',
      lineDash: this.lineDash,
      width: this.lineWidth
    });
  }

  ngOnInit(): void {
    this.control.setStyle(this);
  }

  style(): OLStyle {
    return new OLStyle({
      fill: this.#border(),
      stroke: this.#line(),
      text: this.#coords()
    });
  }
}
