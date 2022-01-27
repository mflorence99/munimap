import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Map } from '@lib/state/map';
import { MapState } from '@lib/state/map';
import { Observable } from 'rxjs';
import { OnInit } from '@angular/core';
import { Select } from '@ngxs/store';
import { ViewState } from '@lib/state/view';
import { ViewStateModel } from '@lib/state/view';

import { combineLatest } from 'rxjs';
import { environment } from '@lib/environment';
import { map } from 'rxjs/operators';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-parcels',
  styleUrls: ['./page.scss'],
  templateUrl: './page.html'
})
export class ParcelsPage implements OnInit {
  env = environment;

  @Select(ViewState.gps) gps$: Observable<boolean>;

  @Select(MapState) map$: Observable<Map>;

  @Select(ViewState.satelliteView) satelliteView$: Observable<boolean>;

  @Select(ViewState.satelliteYear) satelliteYear$: Observable<string>;

  @Select(ViewState) view$: Observable<ViewStateModel>;

  zoom$: Observable<number>;

  // 🔥 this is a horrible HACK
  //    we now get dams from ol-source-dams, so we need to
  //    eliminate the duplicates in places.geojson

  filterDams(feature: any): boolean {
    return feature.properties.type !== 'dam';
  }

  ngOnInit(): void {
    this.zoom$ = combineLatest([this.map$, this.view$]).pipe(
      map(([map, view]) => view.viewByPath[map.path].zoom)
    );
  }
}
