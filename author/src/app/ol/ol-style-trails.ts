import { OLLayerVectorComponent } from './ol-layer-vector';
import { OLMapComponent } from './ol-map';
import { OLStyleComponent } from './ol-style';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';
import { StyleFunction as OLStyleFunction } from 'ol/style/Style';
import { TrailProperties } from '@lib/geojson';

import OLFeature from 'ol/Feature';
import OLFill from 'ol/style/Fill';
import OLMultiLineString from 'ol/geom/MultiLineString';
import OLStroke from 'ol/style/Stroke';
import OLStyle from 'ol/style/Style';
import OLText from 'ol/style/Text';

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
  @Input() maxFontSize = 20;
  @Input() maxTrailWidth = 3;
  @Input() minFontSize = 8;
  @Input() opacity = 0.9;
  @Input() trailWidth = 3;

  constructor(
    private layer: OLLayerVectorComponent,
    private map: OLMapComponent
  ) {
    this.layer.setStyle(this);
  }

  #drawLine(props: TrailProperties, resolution: number): OLStroke {
    const color = this.map.vars['--map-trail-line-color'];
    const trailWidth = this.#trailWidth(resolution);
    return new OLStroke({
      color: `rgba(${color}, ${this.opacity})`,
      lineDash:
        trailWidth > 1
          ? [trailWidth, trailWidth * 2]
          : [trailWidth * 2, trailWidth],
      width: trailWidth
    });
  }

  #drawText(props: TrailProperties, resolution: number): OLText {
    const fontSize = this.#fontSize(resolution);
    // 👉 if the trail label would be too small to see, don't show it
    if (fontSize < this.minFontSize) return null;
    else {
      const color = this.map.vars['--map-trail-text-color'];
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
  }

  #fontSize(resolution: number): number {
    // 👉 fontSize is proportional to the resolution,
    //    but no bigger than the max size specified
    return Math.min(this.maxFontSize, this.fontSize / resolution);
  }

  #trailWidth(resolution: number): number {
    // 👉 trailWidth is proportional to the resolution,
    //    but no bigger than the max size specified
    return Math.min(this.maxTrailWidth, this.trailWidth / resolution);
  }

  style(): OLStyleFunction {
    return (
      trail: OLFeature<OLMultiLineString>,
      resolution: number
    ): OLStyle => {
      const props = trail.getProperties() as TrailProperties;
      return new OLStyle({
        stroke: this.#drawLine(props, resolution),
        text: this.#drawText(props, resolution)
      });
    };
  }
}
