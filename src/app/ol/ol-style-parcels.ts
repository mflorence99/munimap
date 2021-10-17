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
import OLStroke from 'ol/style/Stroke';
import OLStyle from 'ol/style/Style';
import OLText from 'ol/style/Text';

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

  #fill(props: ParcelProperties): OLFill {
    const fill = this.map.vars[`--map-parcel-fill-u${props.usage}`];
    return new OLFill({ color: `rgba(${fill}, 0.5)` });
  }

  #fontSize(props: ParcelProperties, resolution: number): number {
    const area = props.areaComputed;
    let base;
    if (area >= 500) base = 100;
    else if (area >= 100) base = 50;
    else if (area >= 50) base = 25;
    else if (area >= 25) base = 22;
    else if (area >= 10) base = 20;
    else if (area >= 5) base = 18;
    else if (area >= 2) base = 16;
    else if (area >= 1) base = 14;
    else if (area >= 0.75) base = 12;
    else if (area >= 0.5) base = 10;
    else if (area >= 0.25) base = 8;
    else base = 6;
    return base / resolution;
  }

  #isSmall(props: ParcelProperties): boolean {
    return props.areaComputed < 25;
  }

  #isSquare(props: ParcelProperties): boolean {
    return props.sqarcity > 0.6;
  }

  #isTiny(props: ParcelProperties): boolean {
    return props.areaComputed < 0.25;
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

  #offset(_props: ParcelProperties): number[] {
    return [0, 0];
  }

  #rotation(props: ParcelProperties): number {
    const label = props.label;
    const rotate =
      label?.rotate === undefined ? this.#isSmall(props) : label?.rotate;
    return rotate ? props.orientation * (Math.PI / 180) : 0;
  }

  #splitation(props: ParcelProperties): boolean {
    const label = props.label;
    return label?.split === undefined
      ? !this.#isSmall(props) || this.#isSquare(props)
      : label?.split;
  }

  #strokeOutline(_props: ParcelProperties): OLStroke {
    const stroke = this.map.vars['--map-parcel-outline'];
    const width = +this.map.vars['--map-parcel-outline-width'];
    return new OLStroke({ color: stroke, lineDash: [2, 4], width });
  }

  #strokeSelect(_props: ParcelProperties): OLStroke {
    const stroke = this.map.vars['--map-parcel-select'];
    const width = +this.map.vars['--map-parcel-select-width'];
    return new OLStroke({ color: stroke, width });
  }

  #text(props: ParcelProperties, resolution: number): OLText {
    const color = this.map.vars['--map-parcel-text-color'];
    const fontFamily = this.map.vars['--map-parcel-text-font-family'];
    const label = this.#label(props);
    const offset = this.#offset(props);
    return new OLText({
      font: `normal ${this.#fontSize(props, resolution)}px '${fontFamily}'`,
      fill: new OLFill({ color }),
      offsetX: offset[0],
      offsetY: offset[1],
      overflow: true,
      placement: 'point',
      rotation: this.#rotation(props),
      text: label
    });
  }

  style(): OLStyleFunction {
    return (parcel: OLFeature<any>, resolution: number): OLStyle => {
      const props = parcel.getProperties() as ParcelProperties;
      return new OLStyle({
        fill: this.#fill(props),
        stroke: this.#strokeOutline(props),
        text: this.#text(props, resolution)
      });
    };
  }

  styleWhenSelected(): OLStyleFunction {
    return (parcel: OLFeature<any>, resolution: number): OLStyle => {
      const props = parcel.getProperties() as ParcelProperties;
      return new OLStyle({
        fill: this.#fill(props),
        stroke: this.#strokeSelect(props),
        text: this.#text(props, resolution)
      });
    };
  }
}
