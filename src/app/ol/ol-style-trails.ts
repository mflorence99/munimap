import { OLLayerVectorComponent } from './ol-layer-vector';
import { OLMapComponent } from './ol-map';
import { OLStyleComponent } from './ol-style';
import { TrailProperties } from '../services/geojson';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';
import { StyleFunction as OLStyleFunction } from 'ol/style/Style';

import OLFeature from 'ol/Feature';
import OLFill from 'ol/style/Fill';
import OLMultiLineString from 'ol/geom/MultiLineString';
import OLStroke from 'ol/style/Stroke';
import OLStyle from 'ol/style/Style';
import OLText from 'ol/style/Text';

// 👇 draws a trail with:
//      -- a styled color
//      -- with an input opacity
//      -- with an input width
//    add the name of the trail
//      -- with a styled color
//      -- with an input opacity
//      -- with an input font weight, size and family
//    the trail name is only shown
//      -- when the resolution is less than an input threshold

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-style-trails',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLStyleTrailsComponent implements OLStyleComponent {
  @Input() fontFamily = 'Roboto';
  @Input() fontSize = 20;
  @Input() fontWeight: 'bold' | 'normal' = 'bold';
  @Input() opacity = 0.9;
  @Input() threshold = 3;
  @Input() width = 4;

  constructor(
    private layer: OLLayerVectorComponent,
    private map: OLMapComponent
  ) {
    this.layer.setStyle(this);
  }

  #drawLine(props: TrailProperties, resolution: number): OLStroke {
    const color = this.map.vars['--map-trail-line-color'];
    // 👉 width is proportional to the resolution,
    //    but no bigger than the nominal size specified
    const width = Math.min(this.width, this.width / resolution);
    return new OLStroke({
      color: `rgba(${color}, ${this.opacity})`,
      lineDash: [10 / resolution, 10 / resolution],
      width
    });
  }

  #drawText(props: TrailProperties, resolution: number): OLText {
    const color = this.map.vars['--map-trail-text-color'];
    // 👉 fontSize is proportional to the resolution,
    //    but no bigger than the nominal size specified
    const fontSize = Math.min(this.fontSize, this.fontSize / resolution);
    return new OLText({
      fill: new OLFill({ color: `rgba(${color}, ${this.opacity})` }),
      font: `${this.fontWeight} ${fontSize}px '${this.fontFamily}'`,
      placement: 'line',
      stroke: new OLStroke({
        color: `rgba(255, 255, 255, ${this.opacity})`,
        width: 3
      }),
      text: props.name
    });
  }

  style(): OLStyleFunction {
    return (
      trail: OLFeature<OLMultiLineString>,
      resolution: number
    ): OLStyle => {
      const props = trail.getProperties() as TrailProperties;
      if (resolution >= this.threshold) return null;
      else
        return new OLStyle({
          stroke: this.#drawLine(props, resolution),
          text: this.#drawText(props, resolution)
        });
    };
  }
}
