import { RootPage } from './root/page';

import { Actions } from '@ngxs/store';
import { ActivatedRoute } from '@angular/router';
import { AuthState } from '@lib/state/auth';
import { Component } from '@angular/core';
import { DestroyService } from '@lib/services/destroy';
import { LoadMap } from '@lib/state/map';
import { Map } from '@lib/state/map';
import { MapState } from '@lib/state/map';
import { Observable } from 'rxjs';
import { OLMapComponent } from '@lib/ol/ol-map';
import { OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Select } from '@ngxs/store';
import { SetMap } from '@lib/state/map';
import { Store } from '@ngxs/store';
import { ViewChild } from '@angular/core';
import { ViewState } from '@lib/state/view';

import { environment } from '@lib/environment';
import { ofActionSuccessful } from '@ngxs/store';
import { takeUntil } from 'rxjs/operators';

@Component({ template: '' })
export abstract class AbstractMapPage implements OnInit {
  creating = false;

  env = environment;

  @Select(MapState) mapState$: Observable<Map>;

  @ViewChild(OLMapComponent) olMap: OLMapComponent;

  constructor(
    protected actions$: Actions,
    protected authState: AuthState,
    protected destroy$: DestroyService,
    protected root: RootPage,
    protected route: ActivatedRoute,
    protected router: Router,
    protected store: Store,
    protected viewState: ViewState
  ) {}

  #handleActions$(): void {
    this.actions$
      .pipe(ofActionSuccessful(SetMap), takeUntil(this.destroy$))
      .subscribe((action: SetMap) => {
        // 👉 if we were creating a new map, once that's done rewrite the
        //    URL to the map ID so if we reload we don't enter another
        //    creating state
        if (this.creating && action.map.id && action.map.name)
          this.router.navigate([`/${this.getType()}/${action.map.id}`]);
      });
  }

  // 👇 this would not work properly on a route change, but
  //    we have configured the router to always reload on navigate
  //    to the same route -- it makes the way we build the map
  //    much easier too

  // 👁️ root.ts

  #loadMap(): void {
    const id = this.route.snapshot.params['id'];
    // 👉 an ID of '0' signals that we need to create a new map
    this.creating = id === '0';
    const owner = this.authState.currentProfile().email;
    const path = this.route.snapshot.queryParamMap.get('path');
    const recentPath = this.viewState.recentPath();
    // 👉 this is a default map for the case when we are creating
    //    but it is also used if the map we try to load has been deleted
    //    so we try to make sure it has a real path to work with
    const dflt: Map = {
      id: null,
      name: null,
      owner: owner,
      path: path ?? recentPath,
      type: this.getType()
    };
    // 👉 load up the requested (or default) map
    this.store.dispatch(new LoadMap(id, dflt));
    // 👉 set the window title to something we know for now
    this.root.setTitle(path);
  }

  // 🔥 a very hacked up definition of privileged!
  isPrivileged(): boolean {
    return this.authState.currentProfile().email === 'mflo999@gmail.com';
  }

  ngOnInit(): void {
    this.#handleActions$();
    this.#loadMap();
  }

  abstract getType(): string;
}
