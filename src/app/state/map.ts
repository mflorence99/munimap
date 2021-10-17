import { Action } from '@ngxs/store';
import { Injectable } from '@angular/core';
import { State } from '@ngxs/store';
import { StateContext } from '@ngxs/store';

export class SaveMap {
  static readonly type = '[Map] SaveMap';
  constructor() {}
}

export class UpdateMap {
  static readonly type = '[Map] UpdateMap';
  constructor(public map: Map) {}
}

export interface Map {
  id: string;
  name: string;
  style: 'arcgis' | 'google' | 'mapbox' | 'osm' | 'blank';
}

export type MapStateModel = Map;

@State<MapStateModel>({
  name: 'map',
  defaults: {
    id: null,
    name: null,
    style: 'blank'
  }
})
@Injectable()
export class MapState {
  @Action(SaveMap) saveMap(): void {
    // 👉 side-effect will be to save to FireBase
  }

  @Action(UpdateMap) updateMap(
    ctx: StateContext<MapStateModel>,
    action: UpdateMap
  ): void {
    ctx.setState(action.map);
  }
}
