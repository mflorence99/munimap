import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Map } from '@lib/state/map';
import { MapState } from '@lib/state/map';
import { Observable } from 'rxjs';
import { Select } from '@ngxs/store';
import { ViewState } from '@lib/state/view';

import { environment } from '@lib/environment';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-parcels',
  styleUrls: ['./page.scss'],
  templateUrl: './page.html'
})
export class ParcelsPage {
  env = environment;

  @Select(ViewState.gps) gps$: Observable<boolean>;

  @Select(MapState) map$: Observable<Map>;

  @Select(ViewState.satelliteView) satelliteView$: Observable<boolean>;
}
