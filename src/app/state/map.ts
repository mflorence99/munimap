import { Action } from '@ngxs/store';
import { AngularFirestore } from '@angular/fire/firestore';
import { AngularFirestoreCollection } from '@angular/fire/firestore';
import { Injectable } from '@angular/core';
import { State } from '@ngxs/store';
import { StateContext } from '@ngxs/store';

import copy from 'fast-copy';

export class LoadMap {
  static readonly type = '[Map] LoadMap';
  constructor(public id: string, public dflt: Map) {}
}

export class SetMap {
  static readonly type = '[Map] SetMap';
  constructor(public map: Map) {}
}

export class UpdateMap {
  static readonly type = '[Map] UpdateMap';
  constructor(public map: Map) {}
}

export interface Map {
  id: string;
  name: string;
  owner: string;
  path: string;
  style: 'arcgis' | 'google' | 'mapbox' | 'osm' | 'blank';
}

export type MapStateModel = Map;

@State<MapStateModel>({
  name: 'map',
  defaults: null
})
@Injectable()
export class MapState {
  #maps: AngularFirestoreCollection<Map>;

  constructor(private firestore: AngularFirestore) {
    this.#maps = this.firestore.collection<Map>('maps');
  }

  @Action(LoadMap) loadMap(
    ctx: StateContext<MapStateModel>,
    action: LoadMap
  ): void {
    this.#maps
      .doc(action.id)
      .get()
      .subscribe((doc) => {
        const map = doc.exists ? doc.data() : action.dflt;
        ctx.dispatch(new SetMap(map));
      });
  }

  @Action(SetMap) setMap(
    ctx: StateContext<MapStateModel>,
    action: SetMap
  ): void {
    ctx.setState(copy(action.map));
  }

  @Action(UpdateMap) updateMap(
    ctx: StateContext<MapStateModel>,
    action: UpdateMap
  ): void {
    this.#maps
      .doc(action.map.id)
      .set(action.map)
      .then(() => ctx.dispatch(new SetMap(action.map)));
  }
}
