import { Adaptor } from './ol-adaptor';
import { AdaptorComponent } from './ol-adaptor';
import { LandmarkProperties } from '../common';
import { LandmarkPropertiesClass } from '../common';
import { RoadProperties } from '../common';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';

import { forwardRef } from '@angular/core';
import { input } from '@angular/core';

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
  styles: [':host { display: none }'],
  standalone: false
})
export class OLAdaptorRoadsComponent implements Adaptor {
  class6Pattern = input('conglomerate');
  minRoadFeet = input(20);
  rightOfWayRatio = input(3);
  roadLaneRatio = input(0.9);
  roadNameRatio = input(1.5);

  // 👇 construct LandmarkProperties
  adapt(road: RoadProperties): LandmarkProperties[] {
    // 👉 munge road name
    let nm = road.name;
    if (nm === 'No Name') nm = '';
    else if (road.class === 'VI') nm = `${nm} - VI`;
    // else if (road.class === 'IV') nm = `${nm} - IV`;
    // else if (road.class === 'III') nm = `${nm} - III`;
    // else if (road.class === 'II') nm = `${nm} - II`;
    // else if (road.class === 'I') nm = `${nm} - I`;
    else if (road.owner === 'PRIVATE') nm = `${nm} - Pvt`;
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
        strokeFeet: this.#roadFeet(road) * this.roadLaneRatio(),
        strokeOpacity: 1,
        strokeStyle: 'solid',
        zIndex: 2
      }),
      road.class === 'VI'
        ? new LandmarkPropertiesClass({
            lineSpline: true,
            strokeColor: `--map-road-edge-${road.class ?? '0'}`,
            strokeFeet: this.#roadFeet(road) * this.roadLaneRatio(),
            strokeOpacity: 1,
            strokePattern: this.class6Pattern(),
            strokePatternScale: 0.66,
            strokeStyle: 'solid',
            zIndex: 3
          })
        : null,
      new LandmarkPropertiesClass({
        lineChunk: true,
        lineSpline: true,
        name: nm,
        fontColor: `--map-road-text-${road.class ?? '0'}`,
        fontFeet: this.#roadFeet(road) * this.roadNameRatio(),
        fontOpacity: 1,
        fontOutline: true,
        fontStyle: 'bold',
        zIndex: 4
      })
    ];
  }

  #roadFeet(road: RoadProperties): number {
    return Math.max(road.width, this.minRoadFeet()) * this.rightOfWayRatio();
  }
}
