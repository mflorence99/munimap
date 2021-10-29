import { Map } from '../state/map';
import { RootPage } from '../root';
import { UpdateMap } from '../state/map';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';
import { Store } from '@ngxs/store';

import copy from 'fast-copy';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-town-map-setup',
  styleUrls: ['./town-map-setup.scss'],
  templateUrl: './town-map-setup.html'
})
export class TownMapSetupComponent {
  #map: Map;

  @Input()
  get map(): Map {
    return this.#map;
  }
  set map(map: Map) {
    this.#map = copy(map);
    // 👉 set the window title every time it changes
    if (map.name) this.root.setTitle(map.name);
  }

  constructor(private root: RootPage, private store: Store) {}

  update(map: any): void {
    this.store.dispatch(new UpdateMap(map));
  }
}
