import { Map } from '../state/map';
import { MapState } from '../state/map';
import { StyleService } from '../services/style';
import { View } from '../state/view';
import { ViewState } from '../state/view';

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
  @Select(MapState) map$: Observable<Map>;
  @Select(ViewState.view) view$: Observable<View>;

  constructor(public style: StyleService) {}
}
