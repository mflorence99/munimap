import { LoadMap } from '../state/map';
import { Map } from '../state/map';
import { MapState } from '../state/map';
import { RootPage } from '../root';

import { ActivatedRoute } from '@angular/router';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { Select } from '@ngxs/store';
import { Store } from '@ngxs/store';

import { v4 as uuidv4 } from 'uuid';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-town-map',
  styleUrls: ['./town-map.scss'],
  templateUrl: './town-map.html'
})
export class TownMapPage {
  @Select(MapState) map$: Observable<Map>;

  constructor(
    private root: RootPage,
    private route: ActivatedRoute,
    private store: Store
  ) {
    const id = this.route.snapshot.params['id'];
    const dflt: Map = {
      id: uuidv4(),
      name: null,
      owner: this.store.snapshot().auth.profile.email,
      path: this.route.snapshot.queryParamMap.get('path'),
      style: 'blank'
    };
    this.store.dispatch(new LoadMap(id, dflt));
  }
}
