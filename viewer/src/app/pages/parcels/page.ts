import { AbstractMapPage } from '../abstract-map';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Map } from '@lib/state/map';
import { MapState } from '@lib/state/map';
import { Observable } from 'rxjs';
import { OnInit } from '@angular/core';
import { Select } from '@ngxs/store';
import { ViewState } from '@lib/state/view';
import { ViewStateModel } from '@lib/state/view';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-parcels',
  styleUrls: ['../abstract-map.scss'],
  templateUrl: './page.html'
})
export class ParcelsPage extends AbstractMapPage implements OnInit {
  @Select(ViewState.gps) gps$: Observable<boolean>;

  @Select(MapState) map$: Observable<Map>;

  @Select(ViewState.satelliteView) satelliteView$: Observable<boolean>;

  @Select(ViewState.satelliteYear) satelliteYear$: Observable<string>;

  @Select(ViewState) view$: Observable<ViewStateModel>;

  ngOnInit(): void {
    this.onInit();
  }
}
