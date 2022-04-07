import { LandmarkProperties } from '../common';
import { OLLayerVectorComponent } from './ol-layer-vector';
import { OLMapComponent } from './ol-map';
import { Styler } from './ol-styler';
import { StylerComponent } from './ol-styler';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { StyleFunction as OLStyleFunction } from 'ol/style/Style';

import { forwardRef } from '@angular/core';

import OLFill from 'ol/style/Fill';
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

  #fill(props: LandmarkProperties): OLStyle {
    const fillColor = this.map.vars[props.fillColor];
    if (fillColor && props.fillOpacity > 0)
      return new OLStyle({
        fill: new OLFill({
          color: `rgba(${fillColor}, ${props.fillOpacity})`
        })
      });
    else return null;
  }

  #stroke(props: LandmarkProperties): OLStyle {
    const strokeColor = this.map.vars[props.strokeColor];
    if (strokeColor && props.strokeOpacity > 0 && props.strokeWidth > 0)
      return new OLStyle({
        stroke: new OLStroke({
          color: `rgba(${strokeColor}, ${props.strokeOpacity})`,
          width: props.strokeWidth
        })
      });
    else return null;
  }

  style(): OLStyleFunction {
    return (landmark: any): OLStyle[] => {
      const props = landmark.getProperties() as LandmarkProperties;
      const styles: OLStyle[] = [];
      styles.push(this.#fill(props));
      styles.push(this.#stroke(props));
      return styles;
    };
  }
}
