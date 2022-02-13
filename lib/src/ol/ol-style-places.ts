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

// 👇 notice how we treaks lakes and parks specially
//    there's always a big old space to show the label,
//    so we show it bigly -- we really want to see it
//    also -- the icon is redundant, so we drop it

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
  stream: '\uf041',
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

  #drawIcon(props: PlaceProperties, resolution: number): OLImage {
    const color = this.map.vars['--map-place-icon-color'];
    const fontSize = this.#fontSize(props, resolution);
    if (!ICONS[props.type]) return null;
    else
      return new OLFontSymbol({
        color: `rgba(${color}, 1)`,
        font: `'Font Awesome'`,
        fontStyle: 'bold',
        form: 'none',
        radius: fontSize,
        text: ICONS[props.type]
      });
  }

  #drawText(props: PlaceProperties, resolution: number): OLText {
    const color =
      props.type === 'lake'
        ? this.map.vars['--map-place-lake-color']
        : this.map.vars['--map-place-text-color'];
    const fontSize = this.#fontSize(props, resolution);
    return new OLText({
      fill: new OLFill({ color: `rgba(${color}, 1)` }),
      font: `${this.fontWeight} ${fontSize}px '${this.fontFamily}'`,
      offsetY: -fontSize,
      placement: 'point',
      stroke: new OLStroke({
        color: `rgba(255, 255, 255, 1)`,
        width: 3
      }),
      text: this.#titleCase(props.name).replace(/ /g, '\n'),
      textAlign: this.textAlign,
      textBaseline: this.textBaseline
    });
  }

  #fontSize(props: PlaceProperties, resolution: number): number {
    // 👉 fontSize is proportional to the resolution,
    //    but no bigger than the max size specified
    const nominal = Math.min(this.maxFontSize, this.fontSize / resolution);
    return ICONS[props.type] ? nominal : nominal * 3;
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
          geometry: new OLPoint(getCenter(place.getGeometry().getExtent())),
          image: this.#drawIcon(props, resolution),
          text: this.#drawText(props, resolution)
        });
      }
    };
  }
}
