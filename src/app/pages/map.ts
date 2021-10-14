import { MapState } from '../state/map';
import { PushCurrentPath } from '../state/map';
import { View } from '../state/map';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { Select } from '@ngxs/store';
import { Store } from '@ngxs/store';
import { StyleFunction as OLStyleFunction } from 'ol/style/Style';

import OLFeature from 'ol/Feature';
import OLFill from 'ol/style/Fill';
import OLStroke from 'ol/style/Stroke';
import OLStyle from 'ol/style/Style';
import OLText from 'ol/style/Text';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-map',
  styleUrls: ['./map.scss'],
  templateUrl: './map.html'
})
export class MapPage {
  @Select(MapState.view) view$: Observable<View>;

  constructor(private store: Store) {}

  featureStyler(): OLStyleFunction {
    return (_feature: OLFeature<any>, _resolution: number): OLStyle => {
      return new OLStyle({
        fill: new OLFill({ color: [0, 0, 0, 0] }),
        stroke: new OLStroke({ color: [0, 128, 0, 1], width: 2 })
      });
    };
  }

  onSelect(part: string): void {
    this.store.dispatch(new PushCurrentPath(part));
  }

  selectStyler(): OLStyleFunction {
    return (feature: OLFeature<any>, resolution: number): OLStyle => {
      console.log({ id: feature.getId(), resolution });
      return new OLStyle({
        fill: new OLFill({ color: [0, 128, 0, 0.1] }),
        stroke: new OLStroke({ color: [0, 128, 0, 1], width: 2 }),
        text: new OLText({
          font: 'bold 20px Roboto',
          fill: new OLFill({ color: [0, 128, 0, 1] }),
          placement: 'point',
          text: feature.getId() as string
        })
      });
    };
  }
}
