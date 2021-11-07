import { OLLayerVectorComponent } from './ol-layer-vector';
import { OLMapComponent } from './ol-map';
import { OLStyleComponent } from './ol-style';
import { OLStylePatternDirective } from './ol-style-pattern';
import { ParcelProperties } from '../common';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Coordinate as OLCoordinate } from 'ol/coordinate';
import { DecimalPipe } from '@angular/common';
import { Input } from '@angular/core';
import { QueryList } from '@angular/core';
import { StyleFunction as OLStyleFunction } from 'ol/style/Style';
import { ViewChildren } from '@angular/core';

import { fromLonLat } from 'ol/proj';
import { point } from '@turf/helpers';
import { toLonLat } from 'ol/proj';

import bearing from '@turf/bearing';
import OLFeature from 'ol/Feature';
import OLFill from 'ol/style/Fill';
import OLFillPattern from 'ol-ext/style/FillPattern';
import OLIcon from 'ol/style/Icon';
import OLLineString from 'ol/geom/LineString';
import OLPoint from 'ol/geom/Point';
import OLStroke from 'ol/style/Stroke';
import OLStyle from 'ol/style/Style';
import OLText from 'ol/style/Text';
import OLPolygon from 'ol/geom/Polygon';

// 👇 fills, outlines and identifies a parcel feature with:
//    -- text showing the ID and acreage of the parcel
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
//    2 layers, as is useful for the NHGranIT map style

class Dimension {
  constructor(
    public ix: number /* 👈 polygon index */,
    public angle = 0,
    public length = 0,
    public path: OLCoordinate[] = []
  ) {}
}

interface Label {
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  offsetX: number;
  offsetY: number;
  point: OLPoint;
  rotation: number;
  text: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-style-parcels',
  template: `
    <img appPattern src="assets/CUFL.svg" />
    <img appPattern src="assets/CUMH.svg" />
    <img appPattern src="assets/CUMW.svg" />
    <img appPattern src="assets/CUUH.svg" />
    <img appPattern src="assets/CUUW.svg" />
    <img appPattern src="assets/CUWL.svg" />
    <img appPattern src="assets/forest.png" />
    <ng-content></ng-content>
  `,
  styles: [':host { display: none }']
})
export class OLStyleParcelsComponent implements OLStyleComponent {
  // 👉 we don't really want to parameterize these settings as inputs
  //    as they are a WAG to control computed fontSize for acres
  #acresSizeClamp = [0.1, 1000];
  #fontSizeClamp = [0, 66];

  @ViewChildren(OLStylePatternDirective)
  appPatterns: QueryList<OLStylePatternDirective>;

  @Input() borderLineDash = [4, 8];
  @Input() borderWidth = 3;
  @Input() fontFamily = 'Roboto';
  @Input() fontSize = 16;
  @Input() fontSizeAcreageRatio = 0.8;
  @Input() maxBorderWidth = 5;
  @Input() maxOutlineWidth = 3;
  @Input() minBorderWidth = 3;
  @Input() minFontSize = 8;
  @Input() opacity = 0.25;
  @Input() showBackground = false;
  @Input() showDimensions = false;
  @Input() showLabels = false;
  @Input() showSelection = false;
  @Input() straightLineTolerance = 30;

  constructor(
    private decimal: DecimalPipe,
    private layer: OLLayerVectorComponent,
    private map: OLMapComponent
  ) {
    this.layer.setStyle(this);
  }

  #dimensions(
    props: ParcelProperties,
    resolution: number,
    polygons: OLPolygon[],
    whenSelected = false
  ): OLStyle[] {
    // 👇 only if selected when built for selection
    if (this.showSelection && !whenSelected) return null;
    else {
      // 👉 we will draw the length of each "straight" line in each polygon
      const color = this.map.vars['--map-parcel-text-inverse'];
      const outline = this.map.vars['--map-parcel-text-color'];
      const dimensions = this.#dimensionsAnalyze(props, resolution, polygons);
      // 👉 get the fointSizes up front for each polygon
      const fontSizes = this.#dimensionsFontSizes(props, resolution, polygons);
      return (
        dimensions
          // 👉 dont't try to draw the dimension if we can't see it
          .filter((dimension) => fontSizes[dimension.ix] >= this.minFontSize)
          .map((dimension) => {
            const text = new OLText({
              font: `bold ${fontSizes[dimension.ix]}px '${this.fontFamily}'`,
              fill: new OLFill({ color: `rgba(${color}, 1)` }),
              placement: 'line',
              stroke: new OLStroke({
                color: `rgba(${outline}, 1)`,
                width: Math.min(
                  fontSizes[dimension.ix] / 8,
                  this.maxOutlineWidth
                )
              }),
              text: `${Math.round(dimension.length)}`
            });
            const geometry = new OLLineString(
              dimension.path.map((p) => fromLonLat(p))
            );
            return new OLStyle({ geometry, text });
          })
      );
    }
  }

  #dimensionsAnalyze(
    props: ParcelProperties,
    resolution: number,
    polygons: OLPolygon[]
  ): Dimension[] {
    const dimensions: Dimension[] = [];
    props.lengths.forEach((lengths, ix) => {
      // 👉 remember, we made Polygons look like MultiPolygons
      //    also, onky interested in outer ring
      const coords = polygons[ix].getCoordinates()[0];
      let dimension = new Dimension(ix);
      // 👉 we're going to coalesce the lengths of "straight" lines
      lengths.reduce((acc, length, iy) => {
        const p = toLonLat(coords[iy]);
        const q = toLonLat(coords[iy + 1]);
        const angle = bearing(point(p), point(q));
        if (iy === 0) {
          // 👉 this will be true of the first segment
          dimension.angle = angle;
          dimension.length = length;
          dimension.path = [p, q];
        } else {
          // 👉 if the segment is straight enough, record it
          if (!this.#isStraight(angle, dimension.angle)) {
            acc.push(dimension);
            dimension = new Dimension(ix);
          }
          // 👉 setup for next time
          dimension.angle = angle;
          dimension.length += length;
          // 👉 the first line needs a start point, then we just need the end
          if (dimension.path.length === 0) dimension.path.push(p);
          dimension.path.push(q);
        }
        return acc;
      }, dimensions);
      // 👉 don't forget the final, dangling dimension
      if (dimension.path.length > 0) dimensions.push(dimension);
    });
    return dimensions;
  }

  #dimensionsFontSizes(
    props: ParcelProperties,
    resolution: number,
    polygons: OLPolygon[]
  ): number[] {
    return polygons.map((polygon, ix) => {
      const labelFontSize = this.#labelFontSize(props, resolution, ix);
      // 👉 fontSize is proportional to the resolution,
      //    but no bigger than the size of the label
      return Math.min(
        Math.min(labelFontSize * this.fontSizeAcreageRatio, this.fontSize),
        this.fontSize / resolution
      );
    });
  }

  #fill(
    props: ParcelProperties,
    _resolution: number,
    _numPolygons: number
  ): OLStyle[] {
    const fill = this.map.vars[`--map-parcel-fill-u${props.usage}`];
    let patterns;
    // 👉 current use pattern comes from the use field (CUUH etc)
    if (props.usage === '190') {
      const color = this.map.vars[`--map-parcel-stroke-${props.use}`];
      const icon = this.#iconForUse(props.use);
      // not all current usages have a pattern
      if (color && icon) {
        patterns = [
          new OLFill({ color: `rgba(${fill}, ${this.opacity})` }),
          new OLFillPattern({ image: icon })
        ];
      }
    }
    // 👉 town forest uses standard symbol to match OSM etc
    else if (props.usage === '501') {
      const icon = this.#iconForUse('forest');
      patterns = [new OLFillPattern({ image: icon })];
    }
    // 👉 otherwise just use a generic pattern for texture
    if (!patterns) {
      patterns = [
        new OLFillPattern({
          color: `rgba(${fill}, ${this.opacity})`,
          fill: new OLFill({ color: `rgba(${fill}, ${this.opacity})` }),
          pattern: 'dot',
          size: 2,
          spacing: 4
        })
      ];
    }
    // 👉 we always fill, regardless of the resolution
    return patterns.map((pattern) => new OLStyle({ fill: pattern }));
  }

  #iconForUse(use: string): OLIcon {
    const appPattern = this.appPatterns.find((image) =>
      image.matches(new RegExp(use))
    );
    return appPattern
      ? new OLIcon({
          img: appPattern.host.nativeElement,
          imgSize: appPattern.size()
        })
      : null;
  }

  #isLarge(props: ParcelProperties, ix: number): boolean {
    return props.areas[ix] >= 25;
  }

  #isSmall(props: ParcelProperties, ix: number): boolean {
    return props.areas[ix] <= 1;
  }

  #isSquare(props: ParcelProperties, ix: number): boolean {
    return props.sqarcities[ix] > 0.6;
  }

  // 👇 bearings are in degrees
  #isStraight(p: number, q: number): boolean {
    return (
      Math.abs(p - q) < this.straightLineTolerance ||
      Math.abs(p - q) > 360 - this.straightLineTolerance
    );
  }

  #isTiny(props: ParcelProperties, ix: number): boolean {
    return props.areas[ix] <= 0.25;
  }

  // 👇 https://stackoverflow.com/questions/846221/logarithmic-slider
  #labelFontSize(
    props: ParcelProperties,
    resolution: number,
    ix: number
  ): number {
    const minp = this.#fontSizeClamp[0];
    const maxp = this.#fontSizeClamp[1];
    const minv = Math.log(this.#acresSizeClamp[0]);
    const maxv = Math.log(this.#acresSizeClamp[1]);
    const scale = (maxv - minv) / (maxp - minp);
    const acres = Math.max(
      Math.min(props.areas[ix], this.#acresSizeClamp[1]),
      this.#acresSizeClamp[0]
    );
    const nominal = (Math.log(acres) - minv) / scale + minp;
    const adjusted = nominal / resolution;
    return adjusted;
  }

  #labelFontSizeMax(
    props: ParcelProperties,
    resolution: number,
    numPolygons: number
  ): number {
    const fontSizes: number[] = [];
    for (let ix = 0; ix < numPolygons; ix++)
      fontSizes.push(this.#labelFontSize(props, resolution, ix));
    return Math.max(...fontSizes);
  }

  #labels(
    props: ParcelProperties,
    resolution: number,
    numPolygons: number,
    whenSelected = false
  ): OLStyle[] {
    // 👇 only if selected when built for selection
    if (this.showSelection && !whenSelected) return null;
    // 👇 only if feature's label will be visible
    else if (
      this.#labelFontSizeMax(props, resolution, numPolygons) < this.minFontSize
    )
      return null;
    else {
      // TODO 🔥 this is a hack, but we don't want to over-engineer
      //         at this point -- currently, we only showSelection
      //         and showLotLabel at the same time when the selection
      //         is over the dark background of satellite view
      const color = this.showSelection
        ? this.map.vars['--map-parcel-text-inverse']
        : this.map.vars['--map-parcel-text-color'];
      const outline = !this.showSelection
        ? this.map.vars['--map-parcel-text-inverse']
        : this.map.vars['--map-parcel-text-color'];
      // 👉 we need to draw a label in each polygon of a multi-polygon
      //    and a separate label for parcel ID and acreage
      const labels = this.#labelsImpl(props, resolution, numPolygons);
      return labels.map((label) => {
        const text = new OLText({
          font: `${label.fontWeight} ${label.fontSize}px '${label.fontFamily}'`,
          fill: new OLFill({ color: `rgba(${color}, 1)` }),
          offsetX: label.offsetX,
          offsetY: label.offsetY,
          overflow: true,
          rotation: label.rotation,
          stroke: new OLStroke({
            color: `rgba(${outline}, 1)`,
            width: Math.min(label.fontSize / 8, this.maxOutlineWidth)
          }),
          text: label.text
        });
        return new OLStyle({ geometry: label.point, text });
      });
    }
  }

  #labelsImpl(
    props: ParcelProperties,
    resolution: number,
    numLabels: number
  ): Label[] {
    const labels: Label[] = [];
    for (let ix = 0; ix < numLabels; ix++) {
      const fontSize = this.#labelFontSize(props, resolution, ix);
      // 👉 for tiny parcels, we'll only show the parcel # so we can
      //    shortcircuit all the calculations
      if (this.#isTiny(props, ix)) {
        labels.push({
          fontFamily: this.fontFamily,
          fontSize: fontSize,
          fontWeight: 'bold',
          offsetX: 0,
          offsetY: 0,
          point: this.#point(props, ix),
          rotation: this.#rotation(props, ix),
          text: props.id
        });
      } else {
        // 👉 measure up the parcel id and the acreage text
        //    NOTE: the acreage font size is 80% smaller
        const fAcres = this.fontSizeAcreageRatio;
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
        if (!this.#splitation(props, ix)) {
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
          point: this.#point(props, ix),
          rotation: this.#rotation(props, ix),
          text: props.id
        });
        labels.push({
          fontFamily: this.fontFamily,
          fontSize: fontSize * fAcres,
          fontWeight: 'normal',
          offsetX: x2,
          offsetY: y2,
          point: this.#point(props, ix),
          rotation: this.#rotation(props, ix),
          text: acres
        });
      }
    }
    return labels;
  }

  #point(props: ParcelProperties, ix: number): OLPoint {
    return new OLPoint(fromLonLat(props.centers[ix]));
  }

  #rotation(props: ParcelProperties, ix: number): number {
    const label = props.labels?.[ix];
    const rotate =
      label?.rotate === undefined ? !this.#isLarge(props, ix) : label?.rotate;
    // 👈 in radians
    return rotate ? props.orientations[ix] * (Math.PI / 180) : 0;
  }

  #splitation(props: ParcelProperties, ix: number): boolean {
    const label = props.labels?.[ix];
    // 👉 we're ignoring split=false recommendations as that doesn't really
    //    work in the OpenLayers world
    return label?.split === undefined || !label?.split
      ? this.#isSmall(props, ix) ||
          this.#isLarge(props, ix) ||
          this.#isSquare(props, ix)
      : label?.split;
  }

  // 👐 https://stackoverflow.com/questions/45740521
  #strokeOutline(
    props: ParcelProperties,
    resolution: number,
    numPolygons: number
  ): OLStyle[] {
    // 👇 only if feature's label will be visible
    if (
      this.#labelFontSizeMax(props, resolution, numPolygons) < this.minFontSize
    )
      return null;
    else {
      const outline = this.map.vars['--map-parcel-outline'];
      const width = Math.min(
        this.borderWidth / resolution,
        this.maxBorderWidth
      );
      const lineDash = [
        Math.min(this.borderLineDash[0] / resolution, this.borderLineDash[0]),
        Math.min(this.borderLineDash[1] / resolution, this.borderLineDash[1])
      ];
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
    props: ParcelProperties,
    resolution: number,
    numPolygons: number,
    whenSelected = false
  ): OLStyle[] {
    // 👇 only if feature's label will be visible
    if (
      this.#labelFontSizeMax(props, resolution, numPolygons) < this.minFontSize
    )
      return null;
    else {
      const select = this.map.vars['--map-parcel-select'];
      const width = Math.min(
        Math.max(this.borderWidth / resolution, this.minBorderWidth),
        this.maxBorderWidth
      );
      // 👉 necessary so we can select
      const fill = new OLFill({ color: [0, 0, 0, 0] });
      const stroke = new OLStroke({ color: `rgb(${select})`, width });
      return [new OLStyle({ fill, stroke: whenSelected ? stroke : null })];
    }
  }

  #theStyles(
    feature: OLFeature<any>,
    resolution: number,
    whenSelected = false
  ): OLStyle[] {
    let numPolygons = 1;
    if (feature.getGeometry().getType() === 'MultiPolygon')
      numPolygons = feature.getGeometry().getPolygons().length;
    // 👉 we'll adjust how many stroked, fills and texts we draw
    //    depending on the number of polygons and other factors
    const styles: OLStyle[] = [];
    const props = feature.getProperties() as ParcelProperties;
    // 👇 background
    if (this.showBackground) {
      const fills = this.#fill(props, resolution, numPolygons);
      if (fills) styles.push(...fills);
      const strokes = this.#strokeOutline(props, resolution, numPolygons);
      if (strokes) styles.push(...strokes);
    }
    // TODO 🔥 hack -- we only show dimensions when selected
    //         make the coordinate look like they're always multi
    if (this.showDimensions) {
      let polygons = [feature.getGeometry()];
      if (feature.getGeometry().getType() === 'MultiPolygon')
        polygons = feature.getGeometry().getPolygons();
      const dimensions = this.#dimensions(
        props,
        resolution,
        polygons,
        whenSelected
      );
      if (dimensions) styles.push(...dimensions);
    }
    // 👇 lot labels
    if (this.showLabels) {
      const lotLabels = this.#labels(
        props,
        resolution,
        numPolygons,
        whenSelected
      );
      if (lotLabels) styles.push(...lotLabels);
    }
    // 👇 selection
    if (this.showSelection) {
      const strokes = this.#strokeSelect(
        props,
        resolution,
        numPolygons,
        whenSelected
      );
      if (strokes) styles.push(...strokes);
    }
    return styles;
  }

  style(): OLStyleFunction {
    return (feature: OLFeature<any>, resolution: number): OLStyle[] => {
      return this.#theStyles(feature, resolution);
    };
  }

  styleWhenSelected(): OLStyleFunction {
    return (feature: OLFeature<any>, resolution: number): OLStyle[] => {
      return this.#theStyles(feature, resolution, true);
    };
  }
}
