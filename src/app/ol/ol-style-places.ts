import { OLLayerVectorComponent } from './ol-layer-vector';
import { OLMapComponent } from './ol-map';
import { OLStyleComponent } from './ol-style';
import { PlaceProperties } from '../services/geojson';
import { PlacePropertiesType } from '../services/geojson';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';
import { StyleFunction as OLStyleFunction } from 'ol/style/Style';

import OLFeature from 'ol/Feature';
import OLFill from 'ol/style/Fill';
import OLFontSymbol from 'ol-ext/style/FontSymbol';
import OLImage from 'ol/style/Image';
import OLStroke from 'ol/style/Stroke';
import OLStyle from 'ol/style/Style';
import OLText from 'ol/style/Text';

// 👇 draws a marker for a "point" feature with:
//    -- the ID of the feature as Text
//      -- with a styled color
//      -- with an input opacity
//      -- with an input font weight, size and family
//      -- with input horizontal and vertical alignment
//   -- an icon with the same color and opacity
//      -- selected according to the type of place
//   -- the marker is only shown
//      -- when the resolution is less than an input threshold

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
  dam: '\uf041',
  falls: '\uf041',
  flat: '\uf041',
  forest: '\uf1bb',
  gap: '\uf041',
  gut: '\uf041',
  harbor: '\uf21a',
  hospital: '\uf47e',
  island: '\uf041',
  lake: '\uf773',
  locale: '\uf041',
  military: '\uf041',
  mine: '\uf041',
  other: '\uf041',
  park: '\uf1bb',
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
  @Input() opacity = 0.75;
  @Input() textAlign = 'center';
  @Input() textBaseline = 'bottom';
  @Input() threshold = 2;

  constructor(
    private layer: OLLayerVectorComponent,
    private map: OLMapComponent
  ) {
    this.layer.setStyle(this);
  }

  #drawIcon(props: PlaceProperties, resolution: number): OLImage {
    const color = this.map.vars['--map-place-icon-color'];
    const fontSize = this.#fontSize(resolution);
    return new OLFontSymbol({
      color: `rgba(${color}, ${this.opacity})`,
      font: `'Font Awesome 5 Free'`,
      fontStyle: 'bold',
      form: 'none',
      radius: fontSize,
      text: ICONS[props.type]
    });
  }

  #drawText(props: PlaceProperties, resolution: number): OLText {
    const color = this.map.vars['--map-place-text-color'];
    const fontSize = this.#fontSize(resolution);
    return new OLText({
      fill: new OLFill({ color: `rgba(${color}, ${this.opacity})` }),
      font: `${this.fontWeight} ${fontSize}px '${this.fontFamily}'`,
      offsetY: -fontSize,
      placement: 'point',
      stroke: new OLStroke({
        color: `rgba(255, 255, 255, ${this.opacity})`,
        width: 3
      }),
      text: props.name.replace(/ /g, '\n'),
      textAlign: this.textAlign,
      textBaseline: this.textBaseline
    });
  }

  #fontSize(resolution: number): number {
    // 👉 fontSize is proportional to the resolution,
    //    but no bigger than the nominal size specified
    return Math.min(this.fontSize, this.fontSize / resolution);
  }

  style(): OLStyleFunction {
    return (place: OLFeature<any>, resolution: number): OLStyle => {
      const props = place.getProperties() as PlaceProperties;
      if (resolution >= this.threshold) return null;
      else if (!ICONS[props.type] || ICONS[props.type] === '\u0000')
        return null;
      else {
        return new OLStyle({
          image: this.#drawIcon(props, resolution),
          text: this.#drawText(props, resolution)
        });
      }
    };
  }
}
