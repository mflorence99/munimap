import { MapState } from '../state/map';
import { View } from '../state/map';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { Select } from '@ngxs/store';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-map',
  styleUrls: ['./map.scss'],
  templateUrl: './map.html'
})
export class MapPage {
  @Select(MapState.view) view$: Observable<View>;
}
