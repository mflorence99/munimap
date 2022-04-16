import { Adaptor } from './ol-adaptor';
import { AdaptorComponent } from './ol-adaptor';
import { LandmarkProperties } from '../common';
import { LandmarkPropertiesClass } from '../common';
import { RoadProperties } from '../common';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';

import { forwardRef } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: AdaptorComponent,
      useExisting: forwardRef(() => OLAdaptorRoadsComponent)
    }
  ],
  selector: 'app-ol-adaptor-roads',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLAdaptorRoadsComponent implements Adaptor {
  @Input() class6Pattern = 'conglomerate';
  @Input() minRoadFeet = 10 /* 👈 feet */;
  @Input() rightOfWayRatio = 3;
  @Input() roadLaneRatio = 0.9;

  #roadFeet(road: RoadProperties): number {
    return Math.max(road.width, this.minRoadFeet) * this.rightOfWayRatio;
  }

  // 👇 construct LandmarkProperties
  adapt(road: RoadProperties): LandmarkProperties[] {
    return [
      new LandmarkPropertiesClass({
        lineSpline: true,
        strokeColor: `--map-road-edge-${road.class ?? '0'}`,
        strokeFeet: this.#roadFeet(road),
        strokeOpacity: 1,
        strokeStyle: 'solid',
        zIndex: 1
      }),
      new LandmarkPropertiesClass({
        lineSpline: true,
        strokeColor: `--map-road-lane-${road.class ?? '0'}`,
        strokeFeet: this.#roadFeet(road) * this.roadLaneRatio,
        strokeOpacity: 1,
        strokeStyle: 'solid',
        zIndex: 2
      }),
      road.class === 'VI'
        ? new LandmarkPropertiesClass({
            lineSpline: true,
            strokeColor: `--map-road-edge-${road.class ?? '0'}`,
            strokeFeet: this.#roadFeet(road) * this.roadLaneRatio,
            strokeOpacity: 1,
            strokePattern: this.class6Pattern,
            strokePatternScale: 0.66,
            strokeStyle: 'solid',
            zIndex: 3
          })
        : null,
      new LandmarkPropertiesClass({
        lineSpline: true,
        name: road.class === 'VI' ? `${road.name} (Class VI)` : road.name,
        fontColor: `--map-road-text-${road.class ?? '0'}`,
        fontFeet: this.#roadFeet(road) * this.roadLaneRatio,
        fontOpacity: 1,
        fontOutline: true,
        fontStyle: 'bold',
        zIndex: 4
      })
    ];
  }
}
