import { OLLayerVectorComponent } from './ol-layer-vector';
import { OLMapComponent } from './ol-map';
import { OLStyleComponent } from './ol-style';
import { ParcelProperties } from '../services/geojson';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Input } from '@angular/core';
import { StyleFunction as OLStyleFunction } from 'ol/style/Style';

import { fromLonLat } from 'ol/proj';

import OLFeature from 'ol/Feature';
import OLFill from 'ol/style/Fill';
import OLFillPattern from 'ol-ext/style/FillPattern';
import OLIcon from 'ol/style/Icon';
import OLPolygon from 'ol/geom/Polygon';
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
//       -- with an input width
//    -- a styled border color when selected
//       -- with the same width
//    -- the land use fill color is always shown
//    -- the border and text are only shown
//       -- when the fontSize is less than an input threshold

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
  static images = {
    /* eslint-disable @typescript-eslint/naming-convention */
    CUFL: new OLIcon({ src: 'assets/CUFL.svg' }),
    CUMH: new OLIcon({ src: 'assets/CUMH.svg' }),
    CUMW: new OLIcon({ src: 'assets/CUMW.svg' }),
    CUUH: new OLIcon({ src: 'assets/CUUH.svg' }),
    CUUW: new OLIcon({ src: 'assets/CUUW.svg' }),
    CUWL: new OLIcon({ src: 'assets/CUWL.svg' })
    /* eslint-enable @typescript-eslint/naming-convention */
  };

  // 👉 we don't really want to parameterize these settings as inputs
  //    as they are a WAG to control computed fontSize for acres
  #acresSizeClamp = [0.1, 1000];
  #fontSizeClamp = [0, 75];

  @Input() fontFamily = 'Roboto';
  @Input() showBackground = false;
  @Input() showSelection = false;
  @Input() showText = false;
  @Input() threshold = 8;
  @Input() width = 3;

  constructor(
    private decimal: DecimalPipe,
    private layer: OLLayerVectorComponent,
    private map: OLMapComponent
  ) {
    this.layer.setStyle(this);
  }

  #fill(parcel: OLFeature<OLPolygon>, _resolution: number): OLStyle[] {
    const props = parcel.getProperties() as ParcelProperties;
    const fill = this.map.vars[`--map-parcel-fill-u${props.usage}`];
    let patterns;
    // 👉 current use pattern comes from the use field (CUUH etc)
    if (props.usage === '190') {
      const color = this.map.vars[`--map-parcel-stroke-${props.use}`];
      // not all current usages have a pattern
      if (color) {
        patterns = [
          new OLFill({ color: `rgba(${fill}, 0.25)` }),
          new OLFillPattern({
            image: OLStyleParcelsComponent.images[props.use]
          })
        ];
      }
    }
    // 👉 town forest uses standard symbol to match OSM etc
    else if (props.usage === '501') {
      const color = this.map.vars['--map-parcel-stroke-u501'];
      patterns = [
        new OLFillPattern({
          color: `rgba(${color}, 0.5)`,
          fill: new OLFill({ color: `rgba(${fill}, 0.5)` }),
          pattern: 'forest',
          scale: 1
        })
      ];
    }
    // 👉 otherwise just use a generic pattern for texture
    if (!patterns) {
      patterns = [
        new OLFillPattern({
          color: `rgba(${fill}, 0.25)`,
          fill: new OLFill({ color: `rgba(${fill}, 0.25)` }),
          pattern: 'dot',
          size: 2,
          spacing: 4
        })
      ];
    }
    // 👉 we always fill, regardless of the resolution
    return patterns.map((pattern) => new OLStyle({ fill: pattern }));
  }

  // 👇 https://stackoverflow.com/questions/846221/logarithmic-slider
  #fontSize(props: ParcelProperties, resolution: number): number {
    const minp = this.#fontSizeClamp[0];
    const maxp = this.#fontSizeClamp[1];
    const minv = Math.log(this.#acresSizeClamp[0]);
    const maxv = Math.log(this.#acresSizeClamp[1]);
    const scale = (maxv - minv) / (maxp - minp);
    const acres = Math.max(
      Math.min(props.areaComputed, this.#acresSizeClamp[1]),
      this.#acresSizeClamp[0]
    );
    const nominal = (Math.log(acres) - minv) / scale + minp;
    const adjusted = nominal / resolution;
    // console.log({ id: props.id, scale, acres, nominal, adjusted });
    return adjusted;
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

  #offset(parcel: OLFeature<OLPolygon>): number[] {
    // 👉 here we are just finding the delta between what OpenLayers
    //    thinks is the center of the parcel and the much better
    //    "center of gravity" that polylabel pre-computed for us
    const props = parcel.getProperties() as ParcelProperties;
    const [minX, minY, maxX, maxY] = parcel.getGeometry().getExtent();
    const p = this.map.olMap.getPixelFromCoordinate([
      minX + (maxX - minX) / 2,
      minY + (maxY - minY) / 2
    ]);
    const q = this.map.olMap.getPixelFromCoordinate(fromLonLat(props.center));
    const x = q[0] - p[0];
    const y = q[1] - p[1];
    // 👉 https://academo.org/demos/rotation-about-point/
    //    adjust the delta to account for the label rotatin
    const a = this.#rotation(props) * -1;
    return [
      x * Math.cos(a) - y * Math.sin(a),
      y * Math.cos(a) + x * Math.sin(a)
    ];
  }

  #rotation(props: ParcelProperties): number {
    const label = props.label;
    const rotate =
      label?.rotate === undefined ? !this.#isLarge(props) : label?.rotate;
    // 👈 in radians
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

  // 👐 https://stackoverflow.com/questions/45740521
  #strokeOutline(parcel: OLFeature<OLPolygon>, resolution: number): OLStyle[] {
    const props = parcel.getProperties() as ParcelProperties;
    // 👇 only if feature will be visible
    if (this.#fontSize(props, resolution) < this.threshold) return null;
    else {
      const outline = this.map.vars['--map-parcel-outline'];
      const width = this.width / resolution;
      const lineDash = [4 / resolution, 8 / resolution];
      // 👉 alternating light, dark outline
      return [
        new OLStyle({
          stroke: new OLStroke({
            color: 'white',
            lineCap: 'square',
            width
          })
        }),
        new OLStyle({
          stroke: new OLStroke({
            color: `rgb(${outline})`,
            lineCap: 'square',
            lineDash,
            width
          })
        })
      ];
    }
  }

  #strokeSelect(
    parcel: OLFeature<OLPolygon>,
    resolution: number,
    whenSelected = false
  ): OLStyle[] {
    const props = parcel.getProperties() as ParcelProperties;
    // 👇 only if feature will be visible
    if (this.#fontSize(props, resolution) < this.threshold) return null;
    else {
      const select = this.map.vars['--map-parcel-select'];
      const width = Math.max(this.width / resolution, 3);
      // 👉 necessary so we can select
      const fill = new OLFill({ color: [0, 0, 0, 0] });
      const stroke = new OLStroke({ color: `rgb(${select})`, width });
      return [new OLStyle({ fill, stroke: whenSelected ? stroke : null })];
    }
  }

  #text(parcel: OLFeature<OLPolygon>, resolution: number): OLStyle[] {
    const props = parcel.getProperties() as ParcelProperties;
    // 👇 only if feature will be visible
    if (this.#fontSize(props, resolution) < this.threshold) return null;
    else {
      const color = this.map.vars['--map-parcel-text-color'];
      const props = parcel.getProperties() as ParcelProperties;
      const labels = this.#labels(props, resolution);
      const offset = this.#offset(parcel);
      return labels.map((label) => {
        const text = new OLText({
          font: `${label.fontWeight} ${label.fontSize}px '${label.fontFamily}'`,
          fill: new OLFill({ color: `rgba(${color}, 1)` }),
          offsetX: label.offsetX + offset[0],
          offsetY: label.offsetY + offset[1],
          overflow: true,
          padding: [8, 8, 8, 8],
          rotation: this.#rotation(props),
          text: label.text
        });
        return new OLStyle({ text });
      });
    }
  }

  #theStyles(
    parcel: OLFeature<OLPolygon>,
    resolution: number,
    whenSelected = false
  ): OLStyle[] {
    const styles: OLStyle[] = [];
    if (this.showBackground) {
      const fills = this.#fill(parcel, resolution);
      if (fills) styles.push(...fills);
      const strokes = this.#strokeOutline(parcel, resolution);
      if (strokes) styles.push(...strokes);
    }
    if (this.showSelection) {
      const strokes = this.#strokeSelect(parcel, resolution, whenSelected);
      if (strokes) styles.push(...strokes);
    }
    if (this.showText) {
      const texts = this.#text(parcel, resolution);
      if (texts) styles.push(...texts);
    }
    return styles;
  }

  style(): OLStyleFunction {
    return (parcel: OLFeature<OLPolygon>, resolution: number): OLStyle[] => {
      return this.#theStyles(parcel, resolution);
    };
  }

  styleWhenSelected(): OLStyleFunction {
    return (parcel: OLFeature<OLPolygon>, resolution: number): OLStyle[] => {
      return this.#theStyles(parcel, resolution, true);
    };
  }

  static {
    // 👉 all the patterns we use for current use etc
    //    we only really need to do this once, but it does no harm
    // 🔥 tree2 and pine2 not yet released on ol-ext
    OLFillPattern.addPattern('CUMH', {
      width: 30,
      height: 30,
      lines: [
        [
          7.78, 10.61, 4.95, 10.61, 4.95, 7.78, 3.54, 7.78, 2.12, 6.36, 0.71,
          6.36, 0, 4.24, 0.71, 2.12, 4.24, 0, 7.78, 0.71, 9.19, 3.54, 7.78,
          4.95, 7.07, 7.07, 4.95, 7.78, 4.95, 10.61, 7.78, 10.61
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
}
