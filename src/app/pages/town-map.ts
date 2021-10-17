import { Map } from '../state/map';
import { MapState } from '../state/map';
import { View } from '../state/view';
import { ViewState } from '../state/view';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { Select } from '@ngxs/store';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-town-map',
  styleUrls: ['./town-map.scss'],
  templateUrl: './town-map.html'
})
export class TownMapPage {
  @Select(MapState) map$: Observable<Map>;
  @Select(ViewState.view) view$: Observable<View>;

  constructor() {}
}
