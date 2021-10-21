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
//   -- the ID of the feature as Text
//      -- with a styled color
//      -- with an input opacity
//      -- with an input font weight, size and family
//      -- with input horizontal and vertical alignment
//   -- a marker with the same color and opacity
//   -- controlled by an input fontSize threshold below which:
//      -- the place marker is not shown

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
  @Input() fontSize = 10;
  @Input() fontWeight: 'bold' | 'normal' = 'bold';
  @Input() opacity = 0.75;
  @Input() textAlign = 'center';
  @Input() textBaseline = 'bottom';
  @Input() threshold = 6;

  constructor(
    private layer: OLLayerVectorComponent,
    private map: OLMapComponent
  ) {
    this.layer.setStyle(this);
  }

  // 🤯 TODO: we want to do a lot better than a circle
  //    so we are hard-coding its config for now
  #drawIcon(props: PlacesProperties, resolution: number): OLImage {
    const color = this.map.vars[`--map-place-icon-color-${props.type}`];
    const icon = ICONS[props.type];
    return new OLIcon({
      // 👇 can't use rgba here, must use separate opacity
      color: `rgb(${color})`,
      opacity: this.opacity,
      scale: icon.scale / resolution,
      src: icon.src
    });
  }

  #drawText(props: PlacesProperties, resolution: number): OLText {
    const color = this.map.vars[`--map-place-text-color-${props.type}`];
    return new OLText({
      font: `${this.fontWeight} ${this.fontSize / resolution}px '${
        this.fontFamily
      }'`,
      fill: new OLFill({ color: `rgba(${color}, ${this.opacity})` }),
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
      const icon = ICONS[props.type];
      console.log(props.name, icon);
      if (this.fontSize / resolution <= this.threshold) return null;
      else if (!icon) return null;
      else {
        return new OLStyle({
          image: this.#drawIcon(props, resolution),
          text: this.#drawText(props, resolution)
        });
      }
    };
  }
}
