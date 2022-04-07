import { OLFillPatternType } from './ol-styler';
import { OLLayerVectorComponent } from './ol-layer-vector';
import { OLMapComponent } from './ol-map';
import { Styler } from './ol-styler';
import { StylerComponent } from './ol-styler';
import { WetlandProperties } from '../common';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';
import { OnChanges } from '@angular/core';
import { SimpleChanges } from '@angular/core';
import { StyleFunction as OLStyleFunction } from 'ol/style/Style';

import { forwardRef } from '@angular/core';

import OLFill from 'ol/style/Fill';
import OLFillPattern from 'ol-ext/style/FillPattern';
import OLStrokePattern from 'ol-ext/style/StrokePattern';
import OLStyle from 'ol/style/Style';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: StylerComponent,
      useExisting: forwardRef(() => OLStyleWetlandComponent)
    }
  ],
  selector: 'app-ol-style-wetland',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLStyleWetlandComponent implements OnChanges, Styler {
  @Input() maxRiverbankPixels = 10;
  @Input() minRiverbankPixels = 5;
  @Input() riverbank: OLFillPatternType = 'rocks';
  @Input() riverbankOpacity = 0.25;
  @Input() riverbankWidth = 25 /* 👈 feet */;
  @Input() swamp: OLFillPatternType = 'swamp';
  @Input() swampOpacity = 0.5;

  constructor(
    private layer: OLLayerVectorComponent,
    private map: OLMapComponent
  ) {}

  #marsh(): OLStyle[] {
    const fill = this.map.vars['--map-wetland-swamp'];
    // 🐛 FillPattern sometimes throws InvalidStateError
    try {
      return [
        new OLStyle({
          fill: new OLFillPattern({
            color: `rgba(${fill}, ${this.swampOpacity})`,
            pattern: this.swamp
          }),
          stroke: null
        })
      ];
    } catch (ignored) {
      return null;
    }
  }

  #river(resolution: number): OLStyle[] {
    const fill = this.map.vars['--map-waterbody-fill'];
    const stroke = this.map.vars['--map-riverbank-rocks'];
    const styles = [
      new OLStyle({
        fill: new OLFill({ color: `rgba(${fill}, 1)` }),
        stroke: null
      })
    ];
    // 👉 if river bank  is too small to show, don't
    const riverbankPixels = this.#riverbankPixels(resolution);
    if (riverbankPixels >= this.minRiverbankPixels) {
      // 🐛 StrokePattern can throw InvalidState exception
      try {
        styles.push(
          new OLStyle({
            stroke: new OLStrokePattern({
              color: `rgba(${stroke}, ${this.riverbankOpacity})`,
              pattern: this.riverbank,
              scale: 2,
              width: riverbankPixels
            })
          })
        );
      } catch (ignored) {}
    }
    return styles;
  }

  #riverbankPixels(resolution: number): number {
    // 👉 riverbankWidth is proportional to the resolution,
    //    but no bigger than the max size specified
    return Math.min(
      this.maxRiverbankPixels,
      this.riverbankWidth / (resolution * 3.28084)
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (Object.values(changes).some((change) => !change.firstChange)) {
      this.layer.olLayer.getSource().refresh();
    }
  }

  style(): OLStyleFunction {
    return (wetland: any, resolution: number): OLStyle[] => {
      const props = wetland.getProperties() as WetlandProperties;
      if (props.type === 'marsh') return this.#marsh();
      else if (props.type === 'water') return this.#river(resolution);
    };
  }
}
