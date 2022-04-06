import { OLFillPatternType } from './ol-styler';
import { OLLayerVectorComponent } from './ol-layer-vector';
import { OLMapComponent } from './ol-map';
import { Styler } from './ol-styler';
import { StylerComponent } from './ol-styler';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';
import { OnChanges } from '@angular/core';
import { SimpleChanges } from '@angular/core';
import { StyleFunction as OLStyleFunction } from 'ol/style/Style';

import { forwardRef } from '@angular/core';

import OLFill from 'ol/style/Fill';
import OLFillPattern from 'ol-ext/style/FillPattern';
import OLStroke from 'ol/style/Stroke';
import OLStyle from 'ol/style/Style';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: StylerComponent,
      useExisting: forwardRef(() => OLStyleBoundaryComponent)
    }
  ],
  selector: 'app-ol-style-boundary',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLStyleBoundaryComponent implements OnChanges, Styler {
  @Input() borderPixels = 5;
  @Input() opacity = 0.5;
  @Input() pattern: OLFillPatternType = 'gravel';
  @Input() showBorder = false;
  @Input() showInterior = false;

  constructor(
    private layer: OLLayerVectorComponent,
    private map: OLMapComponent
  ) {}

  #drawBorder(): OLStyle {
    const stroke = this.map.vars['--map-boundary-outline'];
    return new OLStyle({
      // 👇 need this so we can click on the feature
      stroke: new OLStroke({
        color: `rgba(${stroke}, ${this.opacity})`,
        width: this.borderPixels
      })
    });
  }

  #fillInterior(): OLStyle {
    const color = this.map.vars['--map-boundary-fill'];
    const shaded = this.map.vars['--map-boundary-pattern'];
    // 🐛 FillPattern sometimes throws InvalidStateError
    let fill = new OLFill({ color: `rgba(${color}, 1)` });
    try {
      fill = new OLFillPattern({
        color: `rgba(${shaded}, 1)`,
        fill: fill,
        pattern: this.pattern
      });
    } catch (ignored) {}
    // 👉 add texture to background inside boundary
    return new OLStyle({
      fill: fill,
      stroke: null
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (Object.values(changes).some((change) => !change.firstChange)) {
      this.layer.olLayer.getSource().refresh();
    }
  }

  style(): OLStyleFunction {
    return (): OLStyle[] => {
      const styles: OLStyle[] = [];
      // 👇 we can draw a border around the boundary
      if (this.showBorder) styles.push(this.#drawBorder());
      // 👇 we can fill the interior of the boundary
      if (this.showInterior) styles.push(this.#fillInterior());
      return styles;
    };
  }
}
