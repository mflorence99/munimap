import { OLLayerVectorComponent } from './ol-layer-vector';
import { OLMapComponent } from './ol-map';
import { OLStyleComponent } from './ol-style';
import { RiverProperties } from '../geojson';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';
import { StyleFunction as OLStyleFunction } from 'ol/style/Style';

import OLFill from 'ol/style/Fill';
import OLStroke from 'ol/style/Stroke';
import OLStyle from 'ol/style/Style';
import OLText from 'ol/style/Text';

// 🔥 ol-source-rivers is great at drawing centerlines and labels,
//    but not as good as ol-source-waterbodies at drawing the actual extent
//    of open water -- also ol-source-waterbodies does NOT include
//    the river/stream name -- hence the experimentalLabelsOnly flag
//    here to suppress the center line -- not ideal, but ... ?

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-style-rivers',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLStyleRiversComponent implements OLStyleComponent {
  @Input() experimentalLabelsOnly = false;
  @Input() fontFamily = 'Roboto';
  @Input() fontSize = 24;
  @Input() fontWeight: 'bold' | 'normal' = 'bold';
  @Input() maxFontSize = 24;
  @Input() maxRiverPixels = 8;
  @Input() minFontSize = 8;
  @Input() riverWidth = 8;

  constructor(
    private layer: OLLayerVectorComponent,
    private map: OLMapComponent
  ) {
    this.layer.setStyle(this);
  }

  #drawLine(props: RiverProperties, resolution: number): OLStroke {
    const color = this.map.vars['--map-river-line-color'];
    let riverPixels = this.#riverPixels(resolution);
    if (props.type === 'stream') riverPixels /= 2;
    return new OLStroke({
      color: `rgba(${color}, 1)`,
      width: riverPixels
    });
  }

  #drawText(props: RiverProperties, resolution: number): OLText {
    const fontSize = this.#fontSize(resolution);
    // 👉 if the river label would be too small to see, don't show it
    if (fontSize < this.minFontSize) return null;
    else if (props.name) {
      const color = this.map.vars['--map-river-text-color'];
      return new OLText({
        fill: new OLFill({ color: `rgba(${color}, 1)` }),
        font: `${this.fontWeight} ${fontSize}px '${this.fontFamily}'`,
        placement: 'line',
        stroke: new OLStroke({
          color: `rgba(255, 255, 255, 1)`,
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

  #riverPixels(resolution: number): number {
    // 👉 riverWidth is proportional to the resolution,
    //    but no bigger than the max size specified
    return Math.min(this.maxRiverPixels, this.riverWidth / resolution);
  }

  style(): OLStyleFunction {
    return (river: any, resolution: number): OLStyle => {
      const props = river.getProperties() as RiverProperties;
      return new OLStyle({
        stroke: this.experimentalLabelsOnly
          ? null
          : this.#drawLine(props, resolution),
        text: this.#drawText(props, resolution)
      });
    };
  }
}
