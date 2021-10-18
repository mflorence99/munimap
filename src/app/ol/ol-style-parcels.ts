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
    return new OLFillPattern({
      color: `rgba(${fill}, 0.25)`,
      fill: new OLFill({ color: `rgba(${fill}, 0.25)` }),
      pattern: 'dot',
      size: 2,
      spacing: 4
    });
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

  #label(props: ParcelProperties): string {
    if (this.#isTiny(props)) return props.id;
    else {
      const nl = this.#splitation(props) ? '\n' : ' ';
      return `${props.id}${nl}${this.decimal.transform(
        props.area,
        '1.0-2'
      )} ac`;
    }
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
    return label?.split === undefined
      ? this.#isSmall(props) || this.#isLarge(props) || this.#isSquare(props)
      : label?.split;
  }

  #strokeOutline(): OLStroke {
    const outline = this.map.vars['--map-parcel-outline'];
    const width = +this.map.vars['--map-parcel-outline-width'];
    return new OLStroke({
      color: `rgba(${outline}, 0.5)`,
      lineDash: [2, 4],
      width
    });
  }

  #strokeSelect(): OLStroke {
    const select = this.map.vars['--map-parcel-select'];
    const width = +this.map.vars['--map-parcel-select-width'];
    return new OLStroke({ color: `rgba(${select}, 1)`, width });
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
        stroke: whenSelected ? this.#strokeSelect() : this.#strokeOutline(),
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
