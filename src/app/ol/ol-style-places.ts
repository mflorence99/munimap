import { OLLayerVectorComponent } from './ol-layer-vector';
import { OLMapComponent } from './ol-map';
import { OLStyleComponent } from './ol-style';
import { PlacesProperties } from '../services/geojson';
import { PlacesPropertiesType } from '../services/geojson';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';
import { StyleFunction as OLStyleFunction } from 'ol/style/Style';

import OLFeature from 'ol/Feature';
import OLFill from 'ol/style/Fill';
import OLIcon from 'ol/style/Icon';
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

// 👉 https://stackoverflow.com/questions/43058070/openlayers-color-an-svg-icon
const ICONS: {
  [key in PlacesPropertiesType]?: { scale: number; src: string };
} = {
  church: { src: 'assets/place-of-worship.svg', scale: 0.1 },
  summit: { src: 'assets/mountain.svg', scale: 0.1 }
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
  @Input() opacity = 0.5;
  @Input() textAlign = 'center';
  @Input() textBaseline = 'bottom';
  @Input() threshold = 2;

  constructor(
    private layer: OLLayerVectorComponent,
    private map: OLMapComponent
  ) {
    this.layer.setStyle(this);
  }

  #drawIcon(props: PlacesProperties, _resolution: number): OLImage {
    const color = this.map.vars[`--map-place-icon-color-${props.type}`];
    const icon = ICONS[props.type];
    return new OLIcon({
      // 👇 can't use rgba here, must use separate opacity
      color: `rgb(${color})`,
      opacity: this.opacity,
      scale: icon.scale,
      src: icon.src
    });
  }

  #drawText(props: PlacesProperties, resolution: number): OLText {
    const color = this.map.vars[`--map-place-text-color-${props.type}`];
    // 👉 fontSize is proportional to the resolution,
    //    but no bigger than the nominal size specified
    const fontSize = Math.min(this.fontSize, this.fontSize / resolution);
    return new OLText({
      fill: new OLFill({ color: `rgba(${color}, ${this.opacity})` }),
      font: `${this.fontWeight} ${fontSize}px '${this.fontFamily}'`,
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

  style(): OLStyleFunction {
    return (place: OLFeature<any>, resolution: number): OLStyle => {
      const props = place.getProperties() as PlacesProperties;
      if (resolution >= this.threshold) return null;
      else if (!ICONS[props.type]) return null;
      else {
        return new OLStyle({
          image: this.#drawIcon(props, resolution),
          text: this.#drawText(props, resolution)
        });
      }
    };
  }
}
