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
      useExisting: forwardRef(() => OLStyleLandmarksComponent)
    }
  ],
  selector: 'app-ol-style-landmarks',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLStyleLandmarksComponent implements Styler {
  constructor(
    private layer: OLLayerVectorComponent,
    private map: OLMapComponent
  ) {}

  style(): OLStyleFunction {
    return (): OLStyle[] => {
      const styles: OLStyle[] = [];
      styles.push(
        new OLStyle({
          fill: new OLFill({ color: [255, 0, 0, 0.25] }),
          stroke: new OLStroke({ color: [255, 0, 0, 1], width: 2 })
        })
      );
      return styles;
    };
  }
}
