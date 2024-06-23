import { ParcelID } from '../common';
import { ParcelProperties } from '../common';
import { Map } from '../state/map';
import { MapState } from '../state/map';
import { ParcelCoding } from '../state/view';
import { ViewState } from '../state/view';
import { ViewStateModel } from '../state/view';
import { OLInteractionSelectParcelsComponent } from './ol-interaction-selectparcels';
import { OLLayerVectorComponent } from './ol-layer-vector';
import { OLMapComponent } from './ol-map';
import { OLStylePatternDirective } from './ol-style-pattern';
import { Styler } from './ol-styler';
import { StylerComponent } from './ol-styler';

import { isParcelStollen } from '../common';
import { getAPDVDFill } from './ol-apdvd2';

import { DecimalPipe } from '@angular/common';
import { TitleCasePipe } from '@angular/common';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';
import { OnChanges } from '@angular/core';
import { SimpleChanges } from '@angular/core';
import { Store } from '@ngxs/store';
import { Coordinate as OLCoordinate } from 'ol/coordinate';
import { StyleFunction as OLStyleFunction } from 'ol/style/Style';

import { bearing } from '@turf/bearing';
import { booleanClockwise } from '@turf/boolean-clockwise';
import { forwardRef } from '@angular/core';
import { inject } from '@angular/core';
import { viewChildren } from '@angular/core';
import { convertLength } from '@turf/helpers';
import { lineString } from '@turf/helpers';
import { point } from '@turf/helpers';
import { fromLonLat } from 'ol/proj';
import { toLonLat } from 'ol/proj';
import { getDistance } from 'ol/sphere';

import OLFillPattern from 'ol-ext/style/FillPattern';
import OLFeature from 'ol/Feature';
import OLLineString from 'ol/geom/LineString';
import OLPoint from 'ol/geom/Point';
import OLPolygon from 'ol/geom/Polygon';
import OLFill from 'ol/style/Fill';
import OLIcon from 'ol/style/Icon';
import OLStroke from 'ol/style/Stroke';
import OLStyle from 'ol/style/Style';
import OLText from 'ol/style/Text';

class Dimension {
  constructor(
    public ix: number /* 👈 polygon index */,
    public clockwise: boolean,
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

type ShowStatus = 'always' | 'never' | 'onlyParcelIDs' | 'whenSelected';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: StylerComponent,
      useExisting: forwardRef(() => OLStyleParcelsComponent)
    }
  ],
  selector: 'app-ol-style-parcels',
  template: `
    <img appPattern src="assets/CUDE.svg" />
    <img appPattern src="assets/CUFL.svg" />
    <img appPattern src="assets/CUMH.svg" />
    <img appPattern src="assets/CUMO.svg" />
    <img appPattern src="assets/CUMW.svg" />
    <img appPattern src="assets/CUNS.svg" />
    <img appPattern src="assets/CUUH.svg" />
    <img appPattern src="assets/CUUL.svg" />
    <img appPattern src="assets/CUUO.svg" />
    <img appPattern src="assets/CUUW.svg" />
    <img appPattern src="assets/CUWL.svg" />
    <img appPattern src="assets/forest.svg" />
    <ng-content></ng-content>
  `,
  styles: [':host { display: none }']
})
export class OLStyleParcelsComponent implements OnChanges, Styler {
  // 👇 @Input/OnChanges works just fine here!

  @Input() borderOpacity = 1;
  @Input() borderWidth = 10 /* 👈 feet */;
  @Input() borderWidthSelectRatio = 2;
  @Input() dimensionsFontSizeRatio = 0.5;
  @Input() fontFamily = 'Roboto';
  @Input() fontSizeAcreageRatio = 0.75;
  @Input() fontSizeAddressRatio = 0.66;
  @Input() forceAbutted = false /* 🔥 experimental */;
  @Input() forceRedrawn = false /* 🔥 experimental */;
  @Input() forceSelected = false /* 🔥 experimental */;
  @Input() labelOpacity = 1;
  @Input() maxBorderPixels = 3;
  @Input() maxFontSize = 40;
  @Input() minFontSize = 9;
  @Input() opacity = 0.25;
  @Input() parcelCoding: ParcelCoding = null;
  @Input() parcelIDs: ParcelID[];
  @Input() showAbutters: ShowStatus = 'never';
  @Input() showBackground: ShowStatus = 'never';
  @Input() showBorder: ShowStatus = 'never';
  @Input() showDimensionContrast: ShowStatus = 'never';
  @Input() showDimensions: ShowStatus = 'never';
  @Input() showLabelContrast: ShowStatus = 'never';
  @Input() showLabels: ShowStatus = 'never';
  @Input() showSelection: ShowStatus = 'never';
  @Input() showStolen: ShowStatus = 'never';
  @Input() straightLineTolerance = 15;

  appPatterns = viewChildren(OLStylePatternDirective);

  #decimal = inject(DecimalPipe);
  #layer = inject(OLLayerVectorComponent);
  #map = inject(OLMapComponent);
  #store = inject(Store);
  #titleCase = inject(TitleCasePipe);

  constructor() {}

  ngOnChanges(changes: SimpleChanges): void {
    if (Object.values(changes).some((change) => !change.firstChange)) {
      this.#layer.olLayer.getSource().refresh();
    }
  }
  style(): OLStyleFunction {
    return (feature: any, resolution: number): OLStyle[] => {
      // 👉 stolen parcels
      if (isParcelStollen(feature.getId()) && this.showStolen === 'never')
        return null;
      // 👉 normal parcels
      else {
        const props = feature.getProperties() as ParcelProperties;
        const whenRedrawn = false;
        const whenSelected = false;
        // 👉 the selector MAY not be present
        const selector =
          this.#map.selector() as OLInteractionSelectParcelsComponent;
        const whenAbutted =
          this.showAbutters === 'whenSelected' &&
          selector?.abutterIDs?.includes(props.id);
        return this.#theStyles(
          feature,
          resolution,
          whenRedrawn || this.forceRedrawn,
          whenSelected || this.forceSelected,
          whenAbutted || this.forceAbutted
        );
      }
    };
  }

  styleWhenSelected(): OLStyleFunction {
    return (feature: any, resolution: number): OLStyle[] => {
      // 👉 stolen parcels
      if (isParcelStollen(feature.getId()) && this.showStolen === 'never')
        return null;
      // 👉 normal parcels
      else {
        const whenRedrawn = !!feature.get('ol-interaction-redraw');
        const whenSelected = true;
        const whenAbutted = false;
        return this.#theStyles(
          feature,
          resolution,
          whenRedrawn,
          whenSelected,
          whenAbutted
        );
      }
    };
  }

  #abbreviateAddress(address: string): string {
    let abbr = this.#titleCase.transform(address);
    abbr = abbr.replace(/\bCircle\b/, ' Cir ');
    abbr = abbr.replace(/\bDrive\b/, ' Dr ');
    abbr = abbr.replace(/\bEast\b/, ' E ');
    abbr = abbr.replace(/\bHeights\b/, ' Hgts ');
    abbr = abbr.replace(/\bLane\b/, ' Ln ');
    abbr = abbr.replace(/\bMountain\b/, ' Mtn ');
    abbr = abbr.replace(/\bNorth\b/, ' N ');
    abbr = abbr.replace(/\bPond\b/, ' Pd ');
    abbr = abbr.replace(/\bRoad\b/, ' Rd ');
    abbr = abbr.replace(/\bSouth\b/, ' S ');
    abbr = abbr.replace(/\bSprings\b/, ' Spr ');
    abbr = abbr.replace(/\bStreet\b/, ' St ');
    abbr = abbr.replace(/\bTerrace\b/, ' Ter ');
    abbr = abbr.replace(/\bWay\b/, ' Wy ');
    abbr = abbr.replace(/\bWest\b/, ' W ');
    return abbr.replace(/ {2,}/g, ' ').trim();
  }

  #borderPixels(resolution: number): number {
    // 👉 borderWidth is proportional to the resolution,
    //    but no bigger than the max size specified
    return Math.min(
      this.maxBorderPixels,
      this.borderWidth / convertLength(resolution, 'meters', 'feet')
    );
  }

  #canShow(
    feature: OLFeature<any>,
    showStatus: ShowStatus,
    whenSelected: boolean
  ): boolean {
    return (
      showStatus === 'always' ||
      (showStatus === 'whenSelected' && whenSelected) ||
      (showStatus === 'onlyParcelIDs' &&
        this.parcelIDs?.includes(feature.getId()))
    );
  }

  #dimensions(
    props: ParcelProperties,
    resolution: number,
    polygons: OLPolygon[],
    contrast: boolean
  ): OLStyle[] {
    // 👉 we will draw the length of each "straight" line in each polygon
    const color = contrast
      ? this.#map.vars['--map-parcel-dimension-inverse']
      : this.#map.vars['--map-parcel-dimension-color'];
    const outline = !contrast
      ? this.#map.vars['--map-parcel-dimension-inverse']
      : this.#map.vars['--map-parcel-dimension-color'];
    const dimensions = this.#dimensionsAnalyze(props, resolution, polygons);
    // 👉 get the fontSizes up front for each polygon
    const fontSizes = this.#dimensionsFontSizes(props, resolution, polygons);
    return (
      dimensions
        // 👉 dont't try to draw the dimension if we can't see it
        .filter((dimension) => fontSizes[dimension.ix] >= this.minFontSize)
        .map((dimension) => {
          // 👉 OL is going to draw the text left-to-right,
          //    compensating for the direction of the line
          //    so we need to understand that to properly calculate the offset
          const ltr =
            dimension.path[0][0] < dimension.path[dimension.path.length - 1][0];
          const text = new OLText({
            font: `italic ${fontSizes[dimension.ix]}px '${this.fontFamily}'`,
            fill: new OLFill({ color: `rgba(${color}, 1)` }),
            offsetY:
              fontSizes[dimension.ix] *
              (ltr ? -1 : 1) *
              (dimension.clockwise ? -1 : 1),
            placement: 'line',
            stroke: new OLStroke({
              color: `rgba(${outline}, 1)`,
              width: fontSizes[dimension.ix] * 0.25
            }),
            text: `${Math.round(dimension.length)}`
          });
          const geometry = new OLLineString(
            dimension.path.map((p) => fromLonLat(p))
          );
          return new OLStyle({ geometry, text, zIndex: 100 });
        })
    );
  }

  #dimensionsAnalyze(
    props: ParcelProperties,
    resolution: number,
    polygons: OLPolygon[]
  ): Dimension[] {
    const dimensions: Dimension[] = [];
    const lengthss = this.#dimensionsLengths(polygons);
    lengthss.forEach((lengths, ix) => {
      // 👉 remember, we made Polygons look like MultiPolygons
      //    also, only interested in outer ring
      const coords = polygons[ix].getCoordinates()[0];
      const ring = lineString(coords);
      const clockwise = booleanClockwise(ring);
      let dimension = new Dimension(ix, clockwise);
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
            dimension = new Dimension(ix, clockwise);
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
      return labelFontSize * this.dimensionsFontSizeRatio;
    });
  }

  #dimensionsLengths(polygons: OLPolygon[]): number[][] {
    const lengthss: number[][] = [];
    polygons.forEach((polygon) => {
      const lengths: number[] = [];
      const points = polygon.getCoordinates()[0];
      for (let ix = 1; ix < points.length; ix++) {
        const c1 = toLonLat(points[ix - 1]);
        const c2 = toLonLat(points[ix]);
        const dist = getDistance(c1, c2);
        lengths.push(convertLength(dist, 'meters', 'feet'));
      }
      lengthss.push(lengths);
    });
    return lengthss;
  }

  #fill(props: ParcelProperties, resolution: number): OLStyle[] {
    // 👇 deduce the fill from the color code strategy
    let fill;
    const parcelCoding =
      this.parcelCoding ??
      this.#store.selectSnapshot<ViewStateModel>(ViewState.view).parcelCoding;
    // 🔥 HACK FOR APDVD
    const map = this.#store.selectSnapshot<Map>(MapState.map);
    if (map?.id === 'apdvd') fill = getAPDVDFill(props);
    else if (parcelCoding === 'usage')
      fill = this.#map.vars[`--map-parcel-fill-u${props.usage}`];
    else if (parcelCoding === 'ownership')
      fill = this.#map.vars[`--map-parcel-fill-o${props.ownership}`];
    else if (parcelCoding === 'conformity') {
      // 🔥 this only works for Washington!!
      const conforming = 4; // 👈 acres
      const deficit = conforming - props.area;
      if (deficit <= 0) fill = '255, 255, 255';
      else {
        // 👇 convert lack of conformity to a scale 0..9
        fill =
          this.#map.vars[
            `--map-parcel-fill-c${Math.trunc(deficit * (10 / conforming))}`
          ];
      }
    }
    // 🔥 just in case it isn't set!!
    else fill = this.#map.vars[`--map-parcel-fill-u${props.usage}`];
    // 👇 determine the patterns
    const patterns = [];
    if (this.#map.olView.getZoomForResolution(resolution) >= 15) {
      // 👉 current use pattern comes from the use field (CUUH etc)
      if (props.usage === '190') {
        const icon = this.#iconForUse(props.use);
        // not all current usages have a pattern
        if (icon) {
          try {
            // 🐛 FillPattern sometimes throws InvalidStateError
            patterns.push(new OLFillPattern({ image: icon }));
          } catch (ignored) {}
        }
      }
      // 👉 town forest uses special symbol
      else if (props.usage === '501') {
        const icon = this.#iconForUse('forest');
        try {
          // 🐛 FillPattern sometimes throws InvalidStateError
          patterns.push(new OLFillPattern({ image: icon }));
        } catch (ignored) {}
      }
    }
    // 👉 otherwise just use a generic pattern for texture
    try {
      // 🐛 FillPattern sometimes throws InvalidStateError
      patterns.push(
        new OLFillPattern({
          color: `rgba(${fill}, ${this.opacity})`,
          fill: new OLFill({ color: `rgba(${fill}, ${this.opacity})` }),
          pattern: 'dot',
          size: 2,
          spacing: 4
        })
      );
    } catch (ignored) {}
    return patterns.map((pattern) => new OLStyle({ fill: pattern }));
  }

  #iconForUse(use: string): OLIcon {
    const appPattern = this.appPatterns().find((image) =>
      image.matches(new RegExp(use))
    );
    return appPattern
      ? new OLIcon({
          img: appPattern.host.nativeElement,
          width: appPattern.size()[0],
          height: appPattern.size()[1]
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

  // 👇 https://stackoverflow.com/questions/846221/logarithmic-slider
  #labelFontSize(
    props: ParcelProperties,
    resolution: number,
    ix: number
  ): number {
    const acres = props.areas[ix];
    let nominal = 0;
    // 👉 this is the nominal font size at zoom level 15.63 / res 3.1
    //    it tracks the successful ramp we used in the legacy app
    if (acres <= 0.1) nominal = 4;
    else if (acres <= 0.25) nominal = 5;
    else if (acres <= 0.5) nominal = 6;
    else if (acres <= 0.75) nominal = 7;
    else if (acres <= 1) nominal = 8;
    else if (acres <= 1.5) nominal = 9;
    else if (acres <= 2) nominal = 10;
    else if (acres <= 5) nominal = 11;
    else if (acres <= 10) nominal = 12;
    else if (acres <= 25) nominal = 14;
    else if (acres <= 50) nominal = 16;
    else if (acres <= 100) nominal = 20;
    else if (acres <= 500) nominal = 24;
    else nominal = 28;
    // 👉 now we wish to adjust by resolution
    //    more zoom, less resolution increases font size
    //    less zoom, more resolution decresaes font size
    //    font size is clamped by a min and a max
    //    3.1 is the magic resolution at which these sizes look good
    return Math.min(nominal / Math.sqrt(resolution / 3.1), this.maxFontSize);
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
    contrast: boolean
  ): OLStyle[] {
    // 👇 only if feature's label will be visible
    if (
      this.#labelFontSizeMax(props, resolution, numPolygons) < this.minFontSize
    )
      return null;
    else {
      const color = contrast
        ? this.#map.vars['--map-parcel-text-inverse']
        : this.#map.vars['--map-parcel-text-color'];
      const outline = !contrast
        ? this.#map.vars['--map-parcel-text-inverse']
        : this.#map.vars['--map-parcel-text-color'];
      // 👉 we need to draw a label in each polygon of a multi-polygon
      //    and a separate label for parcel ID and acreage
      const labels = this.#labelsImpl(props, resolution, numPolygons);
      return labels.map((label) => {
        const text = new OLText({
          font: `${label.fontWeight} ${label.fontSize}px '${label.fontFamily}'`,
          fill: new OLFill({ color: `rgba(${color}, ${this.labelOpacity})` }),
          offsetX: label.offsetX,
          offsetY: label.offsetY,
          overflow: true,
          rotation: label.rotation,
          stroke: contrast
            ? new OLStroke({
                color: `rgba(${outline}, ${this.labelOpacity})`,
                width: Math.min(label.fontSize / 8, this.maxBorderPixels)
              })
            : null,
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
      // 👉 if the fontsize for the acreage is so small we can't
      //    see it, only show the lot ID
      if (fontSize * this.fontSizeAcreageRatio < this.minFontSize) {
        labels.push({
          fontFamily: this.fontFamily,
          fontSize: fontSize,
          fontWeight: 'bold',
          offsetX: 0,
          offsetY: 0,
          point: this.#point(props, ix),
          rotation: this.#rotation(props, ix),
          text: `${props.id}`
        });
      } else {
        // 👉 measure up the parcel id and the subtitle text
        const fAcreage = this.fontSizeAcreageRatio;
        const fAddress = this.fontSizeAddressRatio;
        const mID = this.#map.measureText(
          `${props.id}`,
          `bold ${fontSize}px '${this.fontFamily}'`
        );
        const mGap = this.#map.measureText(
          ' ',
          `normal ${fontSize * fAcreage}px '${this.fontFamily}'`
        );
        // 👉 measure up the subtitles
        const acres = `${this.#decimal.transform(props.area, '1.0-2')} ac`;
        const mAcres = this.#map.measureText(
          acres,
          `normal ${fontSize * fAcreage}px '${this.fontFamily}'`
        );
        const address = this.#abbreviateAddress(props.address);
        // 👇 turns out we don't need this for now
        // const mAddress = this.map.measureText(
        //   address,
        //   `normal ${fontSize * fAddress}px '${this.fontFamily}'`
        // );
        const showAddress =
          fontSize * this.fontSizeAddressRatio >= this.minFontSize;
        // 👉 now compute the x and y offset, which depends
        //    on whether we're splitting the text or not
        let x1 = 0;
        let x2 = 0;
        const x3 = 0;
        let y1 = 0;
        let y2 = 0;
        let y3 = 0;
        // 👉 Firefox doesn't support mID.fontBoundingBoxAscent
        //    so rather than a huge polyfill, use an approximation
        const height = isNaN(mID.fontBoundingBoxAscent)
          ? mGap.width * 5
          : mID.fontBoundingBoxAscent;
        if (!this.#splitation(props, ix)) {
          const total = mID.width + mGap.width + mAcres.width;
          x1 = -(total / 2) + mID.width / 2;
          x2 = total / 2 + -(mAcres.width / 2);
          if (showAddress) {
            y1 = -(height / 2);
            y2 = y1;
            y3 = height / 2;
          }
        } else if (!showAddress) {
          y1 = -(height / 2);
          y2 = height / 2;
        } else {
          y1 = -(height / 1.1);
          y2 = 0;
          y3 = height / 1.25;
        }
        // 👉 finally styles are computed for all segments
        labels.push({
          fontFamily: this.fontFamily,
          fontSize: fontSize,
          fontWeight: 'bold',
          offsetX: x1,
          offsetY: y1,
          point: this.#point(props, ix),
          rotation: this.#rotation(props, ix),
          text: `${props.id}`
        });
        labels.push({
          fontFamily: this.fontFamily,
          fontSize: fontSize * fAcreage,
          fontWeight: 'normal',
          offsetX: x2,
          offsetY: y2,
          point: this.#point(props, ix),
          rotation: this.#rotation(props, ix),
          text: acres
        });
        if (showAddress)
          labels.push({
            fontFamily: this.fontFamily,
            fontSize: fontSize * fAddress,
            fontWeight: 'normal',
            offsetX: x3,
            offsetY: y3,
            point: this.#point(props, ix),
            rotation: this.#rotation(props, ix),
            text: address
          });
      }
    }
    return labels;
  }

  #point(props: ParcelProperties, ix: number): OLPoint {
    try {
      return new OLPoint(fromLonLat(props.centers[ix]));
    } catch (error) {
      console.log(props);
      throw error;
    }
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
    const split =
      label?.split === undefined
        ? this.#isSmall(props, ix) ||
          this.#isLarge(props, ix) ||
          this.#isSquare(props, ix)
        : label?.split;
    return split;
  }

  // 👐 https://stackoverflow.com/questions/45740521
  #strokeBorder(
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
      const borderPixels = this.#borderPixels(resolution);
      const outline = this.#map.vars['--map-parcel-outline'];
      // 👉 alternating light, dark outline
      return [
        new OLStyle({
          stroke: new OLStroke({
            color: `rgba(255, 255, 255, ${this.borderOpacity})`,
            lineCap: 'square',
            width: borderPixels
          })
        }),
        new OLStyle({
          fill: new OLFill({ color: [0, 0, 0, 0] }),
          stroke: new OLStroke({
            color: `rgba(${outline}, ${this.borderOpacity})`,
            lineCap: 'square',
            lineDash:
              borderPixels > 1
                ? [borderPixels, borderPixels * 2]
                : [borderPixels * 2, borderPixels],
            width: borderPixels
          })
        })
      ];
    }
  }

  #strokeSelect(
    props: ParcelProperties,
    resolution: number,
    numPolygons: number,
    whenRedrawn = false,
    whenSelected = false,
    whenAbutted = false
  ): OLStyle[] {
    // 👇 only if feature's label will be visible
    if (
      this.#labelFontSizeMax(props, resolution, numPolygons) < this.minFontSize
    )
      return null;
    // 👉 special stroke if selected or abutter
    const borderPixels =
      this.#borderPixels(resolution) * this.borderWidthSelectRatio;
    let outline = null;
    if (whenAbutted) outline = this.#map.vars['--map-parcel-abutter'];
    if (whenSelected) outline = this.#map.vars['--map-parcel-select'];
    if (whenRedrawn) outline = this.#map.vars['--map-parcel-redraw'];
    // 👉 necessary so we can select
    const fill = new OLFill({ color: [0, 0, 0, 0] });
    const stroke = new OLStroke({
      color: `rgba(${outline}, ${this.borderOpacity})`,
      width: borderPixels
    });
    return [
      new OLStyle({
        fill,
        stroke: outline ? stroke : null,
        zIndex: whenSelected ? 2 : 1
      })
    ];
  }

  #theStyles(
    feature: OLFeature<any>,
    resolution: number,
    whenRedrawn = false,
    whenSelected = false,
    whenAbutted = false
  ): OLStyle[] {
    let numPolygons = 1;
    if (feature.getGeometry().getType() === 'MultiPolygon')
      numPolygons = feature.getGeometry().getPolygons().length;
    // 👉 we'll adjust how many stroked, fills and texts we draw
    //    depending on the number of polygons and other factors
    const styles: OLStyle[] = [];
    const props = feature.getProperties() as ParcelProperties;
    // 👇 background
    if (this.#canShow(feature, this.showBackground, whenSelected)) {
      const fills = this.#fill(props, resolution);
      if (fills) styles.push(...fills);
    }
    // 👇 border
    if (this.#canShow(feature, this.showBorder, whenSelected)) {
      const strokes = this.#strokeBorder(props, resolution, numPolygons);
      if (strokes) styles.push(...strokes);
    }
    // 👇 dimensions
    if (this.#canShow(feature, this.showDimensions, whenSelected)) {
      // 👉 make the coordinates look like they're always multi
      let polygons = [feature.getGeometry()];
      if (feature.getGeometry().getType() === 'MultiPolygon')
        polygons = feature.getGeometry().getPolygons();
      const contrast = this.#canShow(
        feature,
        this.showDimensionContrast,
        whenSelected
      );
      const dimensions = this.#dimensions(
        props,
        resolution,
        polygons,
        contrast
      );
      if (dimensions) styles.push(...dimensions);
    }
    // 👇 lot labels
    if (this.#canShow(feature, this.showLabels, whenSelected)) {
      const contrast = this.#canShow(
        feature,
        this.showLabelContrast,
        whenSelected
      );
      const lotLabels = this.#labels(props, resolution, numPolygons, contrast);
      if (lotLabels) styles.push(...lotLabels);
    }
    // 👇 selection
    if (this.#canShow(feature, this.showSelection, whenSelected)) {
      const strokes = this.#strokeSelect(
        props,
        resolution,
        numPolygons,
        whenRedrawn,
        whenSelected,
        whenAbutted
      );
      if (strokes) styles.push(...strokes);
    }
    return styles;
  }
}
