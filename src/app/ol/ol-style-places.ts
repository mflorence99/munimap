import { OLLayerVectorComponent } from './ol-layer-vector';
import { OLMapComponent } from './ol-map';
import { OLStyleComponent } from './ol-style';
import { PlacesProperties } from '../services/geojson';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';
import { StyleFunction as OLStyleFunction } from 'ol/style/Style';

import OLCircle from 'ol/style/Circle';
import OLFeature from 'ol/Feature';
import OLFill from 'ol/style/Fill';
import OLImage from 'ol/style/Image';
import OLStyle from 'ol/style/Style';
import OLText from 'ol/style/Text';

// ❗❗ EXPERIMENTAL only circles as markers for 'ppl' features like towns

// 👇draws a marker for a "point" feature with:
//   -- the ID of the feature as Text
//      -- with a styled color
//      -- with an input opacity
//      -- with an input font weight, size and family
//      -- with input horizontal and vertical alignment
//   -- a marker with the same color and opacity
//   -- controlled by an input fontSize threshold below which:
//      -- the place marker is not shown

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-style-places',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLStylePlacesComponent implements OLStyleComponent {
  // 👇 the font will likely vary with the type of marker
  @Input() fontFamily = 'Roboto';
  @Input() fontSize = 20;
  @Input() fontWeight: 'bold' | 'normal' = 'bold';
  @Input() opacity = 0.75;
  @Input() textAlign = 'center';
  @Input() textBaseline = 'bottom';
  @Input() threshold = 8;

  constructor(
    private layer: OLLayerVectorComponent,
    private map: OLMapComponent
  ) {
    this.layer.setStyle(this);
  }

  // 🤯 TODO: we want to do a lot better than a circle
  //    so we are hard-coding its config for now
  #drawMarker(props: PlacesProperties, resolution: number): OLImage {
    const color = this.map.vars[`--map-place-color-${props.type}`];
    return new OLCircle({
      fill: new OLFill({ color: `rgba(${color}, ${this.opacity})` }),
      radius: 4 / resolution
    });
  }

  #drawText(props: PlacesProperties, resolution: number): OLText {
    const color = this.map.vars[`--map-place-color-${props.type}`];
    return new OLText({
      font: `${this.fontWeight} ${this.fontSize / resolution}px '${
        this.fontFamily
      }'`,
      fill: new OLFill({ color: `rgba(${color}, ${this.opacity})` }),
      placement: 'point',
      text: props.name,
      textAlign: this.textAlign,
      textBaseline: this.textBaseline
    });
  }

  // ❓ TODO: we are ONLY supporting 'ppl' eg towns for now
  style(): OLStyleFunction {
    return (place: OLFeature<any>, resolution: number): OLStyle => {
      const props = place.getProperties() as PlacesProperties;
      if (this.fontSize / resolution <= this.threshold) return null;
      else if (props.type !== 'ppl') return null;
      else {
        return new OLStyle({
          image: this.#drawMarker(props, resolution),
          text: this.#drawText(props, resolution)
        });
      }
    };
  }
}
