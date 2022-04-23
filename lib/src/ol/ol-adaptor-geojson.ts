import { Adaptor } from './ol-adaptor';
import { AdaptorComponent } from './ol-adaptor';
import { LandmarkProperties } from '../common';
import { LandmarkPropertiesClass } from '../common';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';

import { forwardRef } from '@angular/core';

export type FilterFunction = (name: string) => boolean;

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: AdaptorComponent,
      useExisting: forwardRef(() => OLAdaptorGeoJSONComponent)
    }
  ],
  selector: 'app-ol-adaptor-geojson',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLAdaptorGeoJSONComponent implements Adaptor {
  @Input() borderPixels = 3;
  @Input() filter: FilterFunction;
  @Input() opacity = 0.1;

  // 👇 construct LandmarkProperties
  adapt(source: any): LandmarkProperties[] {
    const unselectable = this.filter && !this.filter(source.name);
    return [
      new LandmarkPropertiesClass({
        fillColor: unselectable ? '--map-feature-disabled' : '--rgb-gray-50',
        fillOpacity: unselectable ? this.opacity : 0,
        strokeColor: '--map-feature-outline',
        strokeOpacity: 1,
        strokePixels: this.borderPixels,
        strokeStyle: 'solid'
      })
    ];
  }

  // 👇 construct LandmarkProperties
  adaptWhenHovering(source: any): LandmarkProperties[] {
    const unselectable = this.filter && !this.filter(source.name);
    if (unselectable) {
      return this.adapt(source);
    } else {
      return [
        new LandmarkPropertiesClass({
          fillColor: '--map-feature-fill',
          fillOpacity: this.opacity,
          fontColor: '--map-feature-text-color',
          fontOpacity: 1,
          fontPixels: 20,
          fontStyle: 'bold',
          name: source.name,
          strokeColor: '--map-feature-outline',
          strokeOpacity: 1,
          strokePixels: this.borderPixels,
          strokeStyle: 'solid'
        })
      ];
    }
  }

  // 👇 construct LandmarkProperties
  adaptWhenSelected(source: any): LandmarkProperties[] {
    const unselectable = this.filter && !this.filter(source.name);
    if (unselectable) {
      return this.adapt(source);
    } else {
      return [
        new LandmarkPropertiesClass({
          strokeColor: '--map-feature-outline',
          strokeOpacity: 1,
          strokePixels: this.borderPixels,
          strokeStyle: 'solid'
        })
      ];
    }
  }
}
