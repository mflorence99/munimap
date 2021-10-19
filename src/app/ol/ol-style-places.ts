import { OLLayerVectorComponent } from './ol-layer-vector';
import { OLMapComponent } from './ol-map';
import { OLStyleComponent } from './ol-style';
import { PlacesProperties } from '../services/geojson';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { StyleFunction as OLStyleFunction } from 'ol/style/Style';

import OLCircle from 'ol/style/Circle';
import OLFeature from 'ol/Feature';
import OLFill from 'ol/style/Fill';
import OLImage from 'ol/style/Image';
import OLStyle from 'ol/style/Style';
import OLText from 'ol/style/Text';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-style-places',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLStylePlacesComponent implements OLStyleComponent {
  constructor(
    private layer: OLLayerVectorComponent,
    private map: OLMapComponent
  ) {
    this.layer.setStyle(this);
  }

  #drawMarker(props: PlacesProperties, resolution: number): OLImage {
    const color = this.map.vars['--map-place-marker-color'];
    const radius = +this.map.vars['--map-place-marker-size'] / resolution;
    return new OLCircle({
      fill: new OLFill({ color: `rgba(${color}, 0.33)` }),
      radius: radius
    });
  }

  #drawText(props: PlacesProperties, resolution: number): OLText {
    const klass = props.type;
    const color = this.map.vars[`--map-place-text-color-${klass}`];
    const fontFamily = this.map.vars['--map-place-text-font-family'];
    const fontSize = +this.map.vars['--map-place-text-font-size'] / resolution;
    if (fontSize < 6) return null;
    else
      return new OLText({
        font: `normal ${fontSize}px '${fontFamily}'`,
        fill: new OLFill({ color: `rgba(${color}, 0.75)` }),
        placement: 'point',
        text: props.name,
        textAlign: 'center',
        textBaseline: 'bottom'
      });
  }

  style(): OLStyleFunction {
    return (place: OLFeature<any>, resolution: number): OLStyle => {
      const props = place.getProperties() as PlacesProperties;
      // ❓ TODO what to support
      if (props.type !== 'ppl') return null;
      else {
        return new OLStyle({
          image: this.#drawMarker(props, resolution),
          text: this.#drawText(props, resolution)
        });
      }
    };
  }
}
