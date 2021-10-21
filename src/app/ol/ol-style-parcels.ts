import { OLLayerVectorComponent } from './ol-layer-vector';
import { OLMapComponent } from './ol-map';
import { OLStyleComponent } from './ol-style';
import { ParcelProperties } from '../services/geojson';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Input } from '@angular/core';
import { StyleFunction as OLStyleFunction } from 'ol/style/Style';

import OLFeature from 'ol/Feature';
import OLFill from 'ol/style/Fill';
import OLFillPattern from 'ol-ext/style/FillPattern';
import OLGeometry from 'ol/geom/Geometry';
import OLStroke from 'ol/style/Stroke';
import OLStyle from 'ol/style/Style';
import OLText from 'ol/style/Text';

// 👇 fills, outlines and identifies a parcel feature with:
//    -- text showing the ID and acreage of the lot
//       -- with a styled color
//       -- with a fontSize proportional to the acreage and the resolution
//       -- with an input font family
//    -- a styled fill color and pattern matching the land use
//    -- a styled border color
//       -- wth an input width
//    -- a styled border color when selected
//       -- wth an input width
//    -- the land use fill color is lways shown
//    -- the border and text are only shown
//       -- when the resolution is less than an input threshold
//       -- threshold is set by acreage

// 👉 showBackground and showText allow parcels to be split into
//    2 layers, as is useful for the "blank" map style

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
  @Input() fontFamily = 'Roboto';
  @Input() fontSize: [area: number, fontSize: number][] = [
    [500, 100],
    [100, 80],
    [50, 70],
    [25, 50],
    [10, 35],
    [5, 20],
    [2, 18],
    [1, 16],
    [0.75, 15],
    [0.5, 14],
    [0.24, 13],
    [0, 10]
  ];
  @Input() showBackground = true;
  @Input() showText = true;
  @Input() threshold: [area: number, resolution: number][] = [
    [500, 500],
    [100, 500],
    [50, 100],
    [25, 50],
    [10, 25],
    [5, 10],
    [2, 5],
    [1, 2],
    [0.75, 1],
    [0.5, 0.75],
    [0.25, 0.5],
    [0, 0.25]
  ];
  @Input() width = {
    outline: 1,
    select: 3
  };

  constructor(
    private decimal: DecimalPipe,
    private layer: OLLayerVectorComponent,
    private map: OLMapComponent
  ) {
    addPatterns();
    this.layer.setStyle(this);
  }

  #fill(parcel: OLFeature<OLGeometry>, resolution: number): OLFill {
    const props = parcel.getProperties() as ParcelProperties;
    const fill = this.map.vars[`--map-parcel-fill-u${props.usage}`];
    let pattern;
    // 👉 current use pattern comes from the use field (CUUH etc)
    if (props.usage === '190') {
      const color = this.map.vars[`--map-parcel-stroke-${props.use}`];
      // not all current usages have a pattern
      if (color) {
        pattern = new OLFillPattern({
          color: `rgba(${color}, 0.15)`,
          fill: new OLFill({ color: `rgba(${fill}, 0.25)` }),
          pattern: props.use,
          scale: Math.max(2 / resolution)
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
        scale: Math.max(1 / resolution)
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
    const step = this.fontSize.find((step) => area >= step[0]);
    return step[1] / resolution;
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
    const fontSize = this.#fontSize(props, resolution);
    // 👉 for tiny lots, we'll only show the lot # so we can
    //    shortcircuit all the calculations
    if (this.#isTiny(props)) {
      labels.push({
        fontFamily: this.fontFamily,
        fontSize: fontSize,
        fontWeight: 'bold',
        offsetX: 0,
        offsetY: 0,
        text: props.id
      });
    } else {
      // 👉 measure up the lot id and the acreage text
      //    NOTE: the acreage font size is 80% smaller
      const fAcres = 0.8;
      const mID = this.map.measureText(
        props.id,
        `bold ${fontSize}px '${this.fontFamily}'`
      );
      const mGap = this.map.measureText(
        '  ',
        `normal ${fontSize * fAcres}px '${this.fontFamily}'`
      );
      const acres = `${this.decimal.transform(props.area, '1.0-2')} ac`;
      const mAcres = this.map.measureText(
        acres,
        `normal ${fontSize * fAcres}px '${this.fontFamily}'`
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
        fontFamily: this.fontFamily,
        fontSize: fontSize,
        fontWeight: 'bold',
        offsetX: x1,
        offsetY: y1,
        text: props.id
      });
      labels.push({
        fontFamily: this.fontFamily,
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

  #strokeOutline(parcel: OLFeature<OLGeometry>, resolution: number): OLStroke {
    const props = parcel.getProperties() as ParcelProperties;
    const area = props.areaComputed;
    const step = this.threshold.find((step) => area >= step[0]);
    if (resolution >= step[1]) return null;
    else {
      const outline = this.map.vars['--map-parcel-outline'];
      const width = this.width.outline / resolution;
      return new OLStroke({
        color: `rgba(${outline}, 0.5)`,
        lineDash: [2, 4],
        width
      });
    }
  }

  #strokeSelect(parcel: OLFeature<OLGeometry>, resolution: number): OLStroke {
    const props = parcel.getProperties() as ParcelProperties;
    const area = props.areaComputed;
    const step = this.threshold.find((step) => area >= step[0]);
    if (resolution >= step[1]) return null;
    else {
      const select = this.map.vars['--map-parcel-select'];
      const width = Math.max(this.width.select / resolution, 3);
      return new OLStroke({ color: `rgba(${select}, 1)`, width });
    }
  }

  #text(parcel: OLFeature<OLGeometry>, resolution: number): OLText[] {
    const props = parcel.getProperties() as ParcelProperties;
    const area = props.areaComputed;
    const step = this.threshold.find((step) => area >= step[0]);
    if (resolution >= step[1]) return [null];
    else {
      const color = this.map.vars['--map-parcel-text-color'];
      const props = parcel.getProperties() as ParcelProperties;
      const labels = this.#labels(props, resolution);
      return labels.map((label) => {
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
  }

  #theStyles(
    parcel: OLFeature<OLGeometry>,
    resolution: number,
    whenSelected = false
  ): OLStyle[] {
    // 👇 we will potentially develop two texts, one for the lot ID
    //    and a second for the acreage
    if (this.showText) {
      const texts = this.#text(parcel, resolution);
      return texts.map((text, ix) => {
        return new OLStyle({
          // 🔥 don't fill 2x as opacity is halved!
          fill:
            this.showBackground && ix === 0
              ? this.#fill(parcel, resolution)
              : null,
          stroke: this.showBackground
            ? whenSelected
              ? this.#strokeSelect(parcel, resolution)
              : this.#strokeOutline(parcel, resolution)
            : null,
          text: text
        });
      });
    } else if (this.showBackground) {
      return [
        new OLStyle({
          fill: this.#fill(parcel, resolution),
          stroke: whenSelected
            ? this.#strokeSelect(parcel, resolution)
            : this.#strokeOutline(parcel, resolution)
        })
      ];
    }
  }

  style(): OLStyleFunction {
    return (parcel: OLFeature<OLGeometry>, resolution: number): OLStyle[] => {
      return this.#theStyles(parcel, resolution);
    };
  }

  styleWhenSelected(): OLStyleFunction {
    return (parcel: OLFeature<OLGeometry>, resolution: number): OLStyle[] => {
      return this.#theStyles(parcel, resolution, true);
    };
  }
}

// 👇 land use categorization patterns

function addPatterns(): void {
  // 👉 all the patterns we use for current use etc
  //    we only really need to do this once, but it does no harm
  // 🔥 tree2 and pine2 not yet released on ol-ext
  OLFillPattern.addPattern('CUMH', {
    width: 30,
    height: 30,
    lines: [
      [
        7.78, 10.61, 4.95, 10.61, 4.95, 7.78, 3.54, 7.78, 2.12, 6.36, 0.71,
        6.36, 0, 4.24, 0.71, 2.12, 4.24, 0, 7.78, 0.71, 9.19, 3.54, 7.78, 4.95,
        7.07, 7.07, 4.95, 7.78, 4.95, 10.61, 7.78, 10.61
      ]
    ],
    repeat: [
      [3, 1],
      [18, 16]
    ],
    fill: 1,
    stroke: 1
  });
  OLFillPattern.addPattern('CUUH', OLFillPattern.prototype.patterns['tree']);
  OLFillPattern.addPattern('CUMW', {
    width: 30,
    height: 30,
    lines: [
      [
        5.66, 11.31, 2.83, 11.31, 2.83, 8.49, 0, 8.49, 2.83, 0, 5.66, 8.49,
        2.83, 8.49, 2.83, 11.31, 5.66, 11.31
      ]
    ],
    repeat: [
      [3, 1],
      [18, 16]
    ],
    fill: 1,
    stroke: 1
  });
  OLFillPattern.addPattern('CUUW', OLFillPattern.prototype.patterns['pine']);
  OLFillPattern.addPattern('CUFL', OLFillPattern.prototype.patterns['grass']);
  OLFillPattern.addPattern('CUWL', OLFillPattern.prototype.patterns['swamp']);
}
