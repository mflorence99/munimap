import { OLLayerVectorComponent } from './ol-layer-vector';
import { OLMapComponent } from './ol-map';
import { ParcelProperties } from '../common';
import { Styler } from './ol-styler';
import { StylerComponent } from './ol-styler';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';
import { OnChanges } from '@angular/core';
import { SimpleChanges } from '@angular/core';
import { StyleFunction as OLStyleFunction } from 'ol/style/Style';

import { forwardRef } from '@angular/core';

import OLFill from 'ol/style/Fill';
import OLStroke from 'ol/style/Stroke';
import OLStyle from 'ol/style/Style';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: StylerComponent,
      useExisting: forwardRef(() => OLStyleConservationComponent)
    }
  ],
  selector: 'app-ol-style-conservation',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLStyleConservationComponent implements OnChanges, Styler {
  @Input() borderPixels = 1;
  @Input() opacity = 0.25;

  constructor(
    private layer: OLLayerVectorComponent,
    private map: OLMapComponent
  ) {}

  #drawConservation(props: ParcelProperties): OLStyle {
    const fill = this.map.vars[`--map-parcel-fill-u${props.usage}`];
    const stroke = this.map.vars['--map-conservation-outline'];
    return new OLStyle({
      fill: new OLFill({ color: `rgba(${fill}, ${this.opacity})` }),
      stroke: new OLStroke({
        color: `rgba(${stroke}, 0)`,
        width: this.borderPixels
      })
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (Object.values(changes).some((change) => !change.firstChange)) {
      this.layer.olLayer.getSource().refresh();
    }
  }

  style(): OLStyleFunction {
    return (conservation: any): OLStyle => {
      const props = conservation.getProperties() as ParcelProperties;
      // 👇 we may be used with a source other than parcels,
      //    in which case we'll show all data
      if (props.usage && !['500', '501', '502'].includes(props.usage))
        return null;
      else return this.#drawConservation(props);
    };
  }
}
