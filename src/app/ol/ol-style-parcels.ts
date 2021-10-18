import { OLLayerVectorComponent } from './ol-layer-vector';
import { OLMapComponent } from './ol-map';
import { OLStyleComponent } from './ol-style';
import { ParcelProperties } from '../services/geojson';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { StyleFunction as OLStyleFunction } from 'ol/style/Style';

import OLFeature from 'ol/Feature';
import OLFill from 'ol/style/Fill';
import OLFillPattern from 'ol-ext/style/FillPattern';
import OLStroke from 'ol/style/Stroke';
import OLStyle from 'ol/style/Style';
import OLText from 'ol/style/Text';

interface Label {
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  offsetX: number;
  offsetY: number;
  text: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-style-parcels',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLStyleParcelsComponent implements OLStyleComponent {
  constructor(
    private decimal: DecimalPipe,
    private layer: OLLayerVectorComponent,
    private map: OLMapComponent
  ) {
    this.layer.setStyle(this);
  }

  #fill(parcel: OLFeature<any>): OLFill {
    const props = parcel.getProperties() as ParcelProperties;
    const fill = this.map.vars[`--map-parcel-fill-u${props.usage}`];
    let pattern;
    // 👉 current use pattern comes from the use field (CUUH etc)
    if (props.usage === '190') {
      const color = this.map.vars[`--map-parcel-stroke-${props.use}`];
      // not all current usages have a pattern
      if (color) {
        pattern = new OLFillPattern({
          color: `rgba(${color}, 0.25)`,
          fill: new OLFill({ color: `rgba(${fill}, 0.25)` }),
          pattern: props.use,
          scale: 1
        });
      }
    }
    // 👉 town forest uses standard symbol to match OSM etc
    else if (props.usage === '501') {
      const color = this.map.vars['--map-parcel-stroke-u501'];
      pattern = new OLFillPattern({
        color: `rgba(${color}, 0.5)`,
        fill: new OLFill({ color: `rgba(${fill}, 0.5)` }),
        pattern: 'forest',
        scale: 1
      });
    }
    // 👉 otherwise just use a generic pattern for texture
    if (!pattern) {
      pattern = new OLFillPattern({
        color: `rgba(${fill}, 0.25)`,
        fill: new OLFill({ color: `rgba(${fill}, 0.25)` }),
        pattern: 'dot',
        size: 2,
        spacing: 4
      });
    }
    return pattern;
  }

  #fontSize(props: ParcelProperties, resolution: number): number {
    const area = props.areaComputed;
    let base;
    if (area >= 500) base = 100;
    else if (area >= 100) base = 80;
    else if (area >= 50) base = 70;
    else if (area >= 25) base = 50;
    else if (area >= 10) base = 35;
    else if (area >= 5) base = 20;
    else if (area >= 2) base = 18;
    else if (area >= 1) base = 16;
    else if (area >= 0.75) base = 15;
    else if (area >= 0.5) base = 14;
    else if (area >= 0.25) base = 13;
    else base = 10;
    return base / resolution;
  }

  #isLarge(props: ParcelProperties): boolean {
    return props.areaComputed >= 25;
  }

  #isSmall(props: ParcelProperties): boolean {
    return props.areaComputed <= 1;
  }

  #isSquare(props: ParcelProperties): boolean {
    return props.sqarcity > 0.6;
  }

  #isTiny(props: ParcelProperties): boolean {
    return props.areaComputed <= 0.25;
  }

  #labels(props: ParcelProperties, resolution: number): Label[] {
    const labels: Label[] = [];
    const fontFamily = this.map.vars['--map-parcel-text-font-family'];
    const fontSize = this.#fontSize(props, resolution);
    // 👉 for tiny lots, we'll only show the lot # so we can
    //    shortcircuit all the calculations
    if (this.#isTiny(props)) {
      labels.push({
        fontFamily: fontFamily,
        fontSize: fontSize,
        fontWeight: 'bold',
        offsetX: 0,
        offsetY: 0,
        text: props.id
      });
    } else {
      // 👉 measure up the lot id and the acreage text
      //    NOTE: the acreage font suze is 80% smaller
      const fAcres = 0.8;
      const mID = this.map.measureText(
        props.id,
        `bold ${fontSize}px '${fontFamily}'`
      );
      const mGap = this.map.measureText(
        '  ',
        `normal ${fontSize * fAcres}px '${fontFamily}'`
      );
      const acres = `${this.decimal.transform(props.area, '1.0-2')} ac`;
      const mAcres = this.map.measureText(
        acres,
        `normal ${fontSize * fAcres}px '${fontFamily}'`
      );
      // 👉 now compute the x and y offset, which depends
      //    on whether we're splitting the text or not
      let x1 = 0;
      let x2 = 0;
      let y1 = 0;
      let y2 = 0;
      if (!this.#splitation(props)) {
        const total = mID.width + mGap.width + mAcres.width;
        x1 = -(total / 2) + mID.width / 2;
        x2 = total / 2 + -(mAcres.width / 2);
      } else {
        y1 = -(mID.fontBoundingBoxAscent / 2);
        y2 = mID.fontBoundingBoxAscent / 2;
      }
      // 👉 finally styles are computed for both segments
      labels.push({
        fontFamily: fontFamily,
        fontSize: fontSize,
        fontWeight: 'bold',
        offsetX: x1,
        offsetY: y1,
        text: props.id
      });
      labels.push({
        fontFamily: fontFamily,
        fontSize: fontSize * fAcres,
        fontWeight: 'normal',
        offsetX: x2,
        offsetY: y2,
        text: acres
      });
    }
    return labels;
  }

  #rotation(props: ParcelProperties): number {
    const label = props.label;
    const rotate =
      label?.rotate === undefined ? !this.#isLarge(props) : label?.rotate;
    return rotate ? props.orientation * (Math.PI / 180) : 0;
  }

  #splitation(props: ParcelProperties): boolean {
    const label = props.label;
    // 👉 we're ignoring split=false recommendations as that doesn't really
    //    work in the OpenLayers world
    return label?.split === undefined || !label?.split
      ? this.#isSmall(props) || this.#isLarge(props) || this.#isSquare(props)
      : label?.split;
  }

  #strokeOutline(resolution: number): OLStroke {
    const outline = this.map.vars['--map-parcel-outline'];
    const width = +this.map.vars['--map-parcel-outline-width'] / resolution;
    if (width < 0.25) return null;
    else
      return new OLStroke({
        color: `rgba(${outline}, 0.5)`,
        lineDash: [2, 4],
        width
      });
  }

  #strokeSelect(resolution: number): OLStroke {
    const select = this.map.vars['--map-parcel-select'];
    const width = +this.map.vars['--map-parcel-select-width'] / resolution;
    if (width < 0.25) return null;
    else return new OLStroke({ color: `rgba(${select}, 1)`, width });
  }

  #text(parcel: OLFeature<any>, resolution: number): OLText[] {
    const color = this.map.vars['--map-parcel-text-color'];
    const props = parcel.getProperties() as ParcelProperties;
    const labels = this.#labels(props, resolution);
    return labels.map((label) => {
      if (label.fontSize < 8) return null;
      else
        return new OLText({
          font: `${label.fontWeight} ${label.fontSize}px '${label.fontFamily}'`,
          fill: new OLFill({ color: `rgba(${color}, 1)` }),
          offsetX: label.offsetX,
          offsetY: label.offsetY,
          overflow: true,
          placement: 'point',
          rotation: this.#rotation(props),
          text: label.text
        });
    });
  }

  #theStyles(
    parcel: OLFeature<any>,
    resolution: number,
    whenSelected = false
  ): OLStyle[] {
    // 👇 we will potentially develop two texts, one for the lot ID
    //    and a second for the acreage
    const texts = this.#text(parcel, resolution);
    return texts.map((text, ix) => {
      return new OLStyle({
        fill: ix === 0 ? this.#fill(parcel) : null,
        stroke: whenSelected
          ? this.#strokeSelect(resolution)
          : this.#strokeOutline(resolution),
        text: text
      });
    });
  }

  style(): OLStyleFunction {
    return (parcel: OLFeature<any>, resolution: number): OLStyle[] => {
      return this.#theStyles(parcel, resolution);
    };
  }

  styleWhenSelected(): OLStyleFunction {
    return (parcel: OLFeature<any>, resolution: number): OLStyle[] => {
      return this.#theStyles(parcel, resolution, true);
    };
  }
}

// 👉 all the patterns we use for current use etc

OLFillPattern.addPattern('CUMH', {
  // 👉 copied from tree
  //    NBEEDS A FILLED VERSION
  width: 30,
  height: 30,
  lines: [
    [
      7.78, 10.61, 4.95, 10.61, 4.95, 7.78, 3.54, 7.78, 2.12, 6.36, 0.71, 6.36,
      0, 4.24, 0.71, 2.12, 4.24, 0, 7.78, 0.71, 9.19, 3.54, 7.78, 4.95, 7.07,
      7.07, 4.95, 7.78
    ]
  ],
  repeat: [
    [3, 1],
    [18, 16]
  ],
  stroke: 1
});

OLFillPattern.addPattern('CUUH', {
  // 👉 copied from tree
  width: 30,
  height: 30,
  lines: [
    [
      7.78, 10.61, 4.95, 10.61, 4.95, 7.78, 3.54, 7.78, 2.12, 6.36, 0.71, 6.36,
      0, 4.24, 0.71, 2.12, 4.24, 0, 7.78, 0.71, 9.19, 3.54, 7.78, 4.95, 7.07,
      7.07, 4.95, 7.78
    ]
  ],
  repeat: [
    [3, 1],
    [18, 16]
  ],
  stroke: 1
});

OLFillPattern.addPattern('CUMW', {
  // 👉 copied from pine
  //    NBEEDS A FILLED VERSION
  width: 30,
  height: 30,
  lines: [
    [
      5.66, 11.31, 2.83, 11.31, 2.83, 8.49, 0, 8.49, 2.83, 0, 5.66, 8.49, 2.83,
      8.49
    ]
  ],
  repeat: [
    [3, 1],
    [18, 16]
  ],
  stroke: 1
});

OLFillPattern.addPattern('CUUW', {
  // 👉 copied from pine
  width: 30,
  height: 30,
  lines: [
    [
      5.66, 11.31, 2.83, 11.31, 2.83, 8.49, 0, 8.49, 2.83, 0, 5.66, 8.49, 2.83,
      8.49
    ]
  ],
  repeat: [
    [3, 1],
    [18, 16]
  ],
  stroke: 1
});

OLFillPattern.addPattern('CUFL', {
  // 👉 copied from grass
  width: 27,
  height: 22,
  lines: [
    [0, 10.5, 13, 10.5],
    [2.5, 10, 1.5, 7],
    [4.5, 10, 4.5, 5, 3.5, 4],
    [7, 10, 7.5, 6, 8.5, 3],
    [10, 10, 11, 6]
  ],
  repeat: [
    [0, 0],
    [14, 10]
  ],
  stroke: 1
});

OLFillPattern.addPattern('CUWL', {
  // 👉 copied from swamp
  width: 24,
  height: 23,
  lines: [
    [0, 10.5, 9.5, 10.5],
    [2.5, 10, 2.5, 7],
    [4.5, 10, 4.5, 4],
    [6.5, 10, 6.5, 6],
    [3, 12.5, 7, 12.5]
  ],
  repeat: [
    [0, 0],
    [14, 10]
  ],
  stroke: 1
});
