import { Action } from '@ngxs/store';
import { AngularFirestore } from '@angular/fire/firestore';
import { AngularFirestoreCollection } from '@angular/fire/firestore';
import { Injectable } from '@angular/core';
import { State } from '@ngxs/store';
import { StateContext } from '@ngxs/store';
import { Store } from '@ngxs/store';

import copy from 'fast-copy';

export class DeleteMap {
  static readonly type = '[Map] DeleteMap';
  constructor(public id: string) {}
}

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
  style: MapStyle;
}

export type MapStyle = 'arcgis' | 'google' | 'mapbox' | 'osm' | 'nhgranit';

export type MapStateModel = Map;

@State<MapStateModel>({
  name: 'map',
  defaults: null
})
@Injectable()
export class MapState {
  #maps: AngularFirestoreCollection<Map>;

  constructor(private firestore: AngularFirestore, private store: Store) {
    this.#maps = this.firestore.collection<Map>('maps');
  }

  currentMap(): Map {
    return this.store.snapshot().map;
  }

  @Action(DeleteMap) deleteMap(
    ctx: StateContext<MapStateModel>,
    action: DeleteMap
  ): void {
    ctx.setState(null);
    this.#maps.doc(action.id).delete();
  }

  @Action(LoadMap) loadMap(
    ctx: StateContext<MapStateModel>,
    action: LoadMap
  ): void {
    // 👇 there's no map until there is one
    //    we can't use the old one!
    ctx.setState(null);
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
      .set(action.map, { merge: true })
      .then(() => ctx.dispatch(new SetMap(action.map)));
  }
}
