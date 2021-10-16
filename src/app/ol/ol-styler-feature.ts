import { OLStylerService } from './ol-styler';

import { Injectable } from '@angular/core';
import { StyleFunction as OLStyleFunction } from 'ol/style/Style';

import OLFeature from 'ol/Feature';
import OLFill from 'ol/style/Fill';
import OLStroke from 'ol/style/Stroke';
import OLStyle from 'ol/style/Style';
import OLText from 'ol/style/Text';

@Injectable({ providedIn: 'root' })
export class OLStylerFeatureService extends OLStylerService {
  outline(): OLStyleFunction {
    const stroke = this.var['--map-feature-outline'];
    const width = +this.var['--map-feature-outline-width'];
    return (): OLStyle => {
      return new OLStyle({
        fill: new OLFill({ color: [0, 0, 0, 0] }),
        stroke: new OLStroke({ color: stroke, width })
      });
    };
  }

  select(): OLStyleFunction {
    const color = this.var['--map-feature-text-color'];
    const fill = this.var['--map-feature-fill'];
    const fontFamily = this.var['--map-feature-text-font-family'];
    const stroke = this.var['--map-feature-outline'];
    const width = +this.var['--map-feature-outline-width'];
    return (feature: OLFeature<any>, resolution: number): OLStyle => {
      console.log({ id: feature.getId(), resolution });
      return new OLStyle({
        fill: new OLFill({ color: fill }),
        stroke: new OLStroke({ color: stroke, width }),
        text: new OLText({
          font: `bold 20px '${fontFamily}'`,
          fill: new OLFill({ color }),
          placement: 'point',
          text: feature.getId() as string
        })
      });
    };
  }
}
