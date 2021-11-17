import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Map } from '@lib/state/map';
import { MapState } from '@lib/state/map';
import { Observable } from 'rxjs';
import { Select } from '@ngxs/store';
import { ViewState } from '@lib/state/view';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-town-map',
  styleUrls: ['./town-map.scss'],
  templateUrl: './town-map.html'
})
export class TownMapPage {
  @Select(ViewState.gps) gps$: Observable<boolean>;

  @Select(MapState) map$: Observable<Map>;
}
