import { OLLayerVectorComponent } from './ol-layer-vector';
import { OLMapComponent } from './ol-map';
import { OLStyleComponent } from './ol-style';
import { PlaceProperties } from '../geojson';
import { PlacePropertiesType } from '../geojson';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';
import { StyleFunction as OLStyleFunction } from 'ol/style/Style';

import { getCenter } from 'ol/extent';

import OLFill from 'ol/style/Fill';
import OLFontSymbol from 'ol-ext/style/FontSymbol';
import OLImage from 'ol/style/Image';
import OLPoint from 'ol/geom/Point';
import OLStroke from 'ol/style/Stroke';
import OLStyle from 'ol/style/Style';
import OLText from 'ol/style/Text';

interface PlaceStyleAttributes {
  colorKey: string;
  fontSizeRatio: number;
  placement: 'line' | 'point';
}

// 👇 most places are drawn like this

const DEFAULT: PlaceStyleAttributes = {
  colorKey: '--map-place-text-color',
  fontSizeRatio: 1,
  placement: 'point'
};

const EXCEPTIONS: {
  [key in PlacePropertiesType]?: PlaceStyleAttributes;
} = {
  lake: {
    colorKey: '--map-place-water-color',
    fontSizeRatio: 3,
    placement: 'point'
  },
  park: {
    colorKey: '--map-place-text-color',
    fontSizeRatio: 3,
    placement: 'point'
  },
  stream: {
    colorKey: '--map-place-water-color',
    fontSizeRatio: 2,
    placement: 'line'
  }
};

// 👇 place types not in this list are ignored
//    place types without an icon show onky text

const ICONS: {
  [key in PlacePropertiesType]?: string;
} = {
  airport: '\uf072',
  area: '\uf124',
  bar: '\uf000',
  basin: '\uf773',
  bay: '\uf773',
  beach: '\uf5ca',
  bench: '\uf6c0',
  bend: '\uf5eb',
  bridge: '\uf041',
  building: '\uf1ad',
  canal: '\uf041',
  cape: '\uf041',
  cave: '\uf041',
  cemetery: '\uf654',
  channel: '\uf041',
  church: '\uf67f',
  civil: '\uf041',
  cliff: '\uf041',
  crossing: '\uf00d',
  dam: '\uf773',
  falls: '\uf041',
  flat: '\uf041',
  forest: '\uf1bb',
  gap: '\uf041',
  gut: '\uf041',
  harbor: '\uf21a',
  hospital: '\uf47e',
  island: '\uf041',
  lake: null,
  locale: '\uf041',
  military: '\uf041',
  mine: '\uf041',
  other: '\uf041',
  park: null,
  pillar: '\uf041',
  po: '\uf674',
  range: '\uf041',
  rapids: '\uf041',
  reserve: '\uf155',
  reservoir: '\uf773',
  ridge: '\uf041',
  school: '\uf549',
  sea: '\uf773',
  slope: '\uf041',
  spring: '\uf041',
  stream: null,
  summit: '\uf6fc',
  swamp: '\uf041',
  tower: '\uf041',
  trail: '\uf041',
  valley: '\uf041',
  woods: '\uf1bb'
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-style-places',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLStylePlacesComponent implements OLStyleComponent {
  @Input() fontFamily = 'Roboto';
  @Input() fontSize = 12;
  @Input() fontWeight: 'bold' | 'normal' = 'bold';
  @Input() maxFontSize = 10;
  @Input() minFontSize = 4;
  @Input() textAlign = 'center';
  @Input() textBaseline = 'bottom';

  constructor(
    private layer: OLLayerVectorComponent,
    private map: OLMapComponent
  ) {
    this.layer.setStyle(this);
  }

  #attrs(props: PlaceProperties): PlaceStyleAttributes {
    // 👉 if the place type is in the exceptions list, use that
    //    otherwise use the default attributes
    return EXCEPTIONS[props.type] || DEFAULT;
  }

  #drawIcon(props: PlaceProperties, resolution: number): OLImage {
    if (!ICONS[props.type]) return null;
    else {
      const attrs = this.#attrs(props);
      const color = this.map.vars[attrs.colorKey];
      const fontSize = this.#fontSize(props, resolution) * attrs.fontSizeRatio;
      return new OLFontSymbol({
        color: `rgba(${color}, 1)`,
        font: `'Font Awesome'`,
        fontStyle: 'bold',
        form: 'none',
        radius: fontSize,
        text: ICONS[props.type]
      });
    }
  }

  #drawText(props: PlaceProperties, resolution: number): OLText {
    const attrs = this.#attrs(props);
    const color = this.map.vars[attrs.colorKey];
    const fontSize = this.#fontSize(props, resolution) * attrs.fontSizeRatio;
    return new OLText({
      fill: new OLFill({ color: `rgba(${color}, 1)` }),
      font: `${this.fontWeight} ${fontSize}px '${this.fontFamily}'`,
      offsetY: attrs.placement === 'point' ? fontSize : undefined,
      placement: attrs.placement,
      stroke: new OLStroke({
        color: `rgba(255, 255, 255, 1)`,
        width: 3
      }),
      text:
        attrs.placement === 'point'
          ? this.#titleCase(props.name).replace(/ /g, '\n')
          : props.name,
      textAlign: attrs.placement === 'point' ? this.textAlign : undefined,
      textBaseline: attrs.placement === 'point' ? this.textBaseline : undefined
    });
  }

  #fontSize(props: PlaceProperties, resolution: number): number {
    // 👉 fontSize is proportional to the resolution,
    //    but no bigger than the max size specified
    return Math.min(this.maxFontSize, this.fontSize / resolution);
  }

  #titleCase(text: string): string {
    return text.replace(
      /\w\S*/g,
      (str) => str.charAt(0).toUpperCase() + str.substring(1).toLowerCase()
    );
  }

  style(): OLStyleFunction {
    return (place: any, resolution: number): OLStyle => {
      const props = place.getProperties() as PlaceProperties;
      const attrs = this.#attrs(props);
      const fontSize = this.#fontSize(props, resolution);
      // 👉 if the place label would be too small to see, don't show anything
      if (fontSize < this.minFontSize) return null;
      // 🔥 HACK -- this entry appears to be noise -- it only
      //    marks the geographical center of town, which is meaningless
      else if (props.name.endsWith(', Town of')) return null;
      // 👉 don't show anything we don't know about
      else if (ICONS[props.type] === undefined) return null;
      else {
        return new OLStyle({
          // 👇 geometry MUST be set to 'point' or else the icon won't show
          geometry:
            attrs.placement === 'point'
              ? new OLPoint(getCenter(place.getGeometry().getExtent()))
              : undefined,
          image: this.#drawIcon(props, resolution),
          text: this.#drawText(props, resolution)
        });
      }
    };
  }
}
