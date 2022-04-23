import { ContextMenuComponent } from './contextmenu-component';
import { ContextMenuHostDirective } from './contextmenu-host';
import { RootPage } from './root/page';

import { Actions } from '@ngxs/store';
import { ActivatedRoute } from '@angular/router';
import { AuthState } from '@lib/state/auth';
import { Component } from '@angular/core';
import { ComponentFactory } from '@angular/core';
import { ComponentRef } from '@angular/core';
import { DestroyService } from '@lib/services/destroy';
import { LoadMap } from '@lib/state/map';
import { Map } from '@lib/state/map';
import { MapState } from '@lib/state/map';
import { MapType } from '@lib/state/map';
import { MatDrawer } from '@angular/material/sidenav';
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
import { unByKey } from 'ol/Observable';

@Component({ template: '' })
export abstract class AbstractMapPage implements OnInit {
  @ViewChild(ContextMenuHostDirective)
  contextMenuHost: ContextMenuHostDirective;

  creating = false;

  @ViewChild('drawer') drawer: MatDrawer;

  env = environment;

  @Select(MapState) mapState$: Observable<Map>;

  @ViewChild(OLMapComponent) olMap: OLMapComponent;

  @Select(ViewState.satelliteView) satelliteView$: Observable<boolean>;

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
        // 👉 when we log in and out on the same computer,
        //    we could be loading the "last used" map
        //    which we aren't authorized to see
        const profile = this.authState.currentProfile();
        const workgroup = profile.email + ' ' + (profile.workgroup ?? '');
        if (!workgroup.includes(action.map.owner))
          this.router.navigate(['/create']);
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
      printSize: [45, 60],
      type: this.getType()
    };
    // 👉 load up the requested (or default) map
    this.store.dispatch(new LoadMap(id, dflt, /* touch = */ true));
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

  onContextMenuImpl(cFactory: ComponentFactory<ContextMenuComponent>): void {
    this.drawer.open();
    this.contextMenuHost.vcRef.clear();
    const cRef: ComponentRef<ContextMenuComponent> =
      this.contextMenuHost.vcRef.createComponent(cFactory);
    // 👉 populate @Input() fields
    const comp = cRef.instance;
    comp.drawer = this.drawer;
    comp.map = this.olMap;
    // 👉 there really should be a selector, or else we couldn't be here
    let key;
    const selector = this.olMap.selector;
    if (selector) {
      const source = selector.layer.olLayer.getSource();
      comp.selectedIDs = selector.selectedIDs;
      comp.features = comp.selectedIDs.map((id) => source.getFeatureById(id));
      // 👉 watch for delta in features
      key = source.on('featuresloadend', () => {
        comp.features = comp.selectedIDs.map((id) => source.getFeatureById(id));
        comp.refresh();
      });
    } else {
      comp.selectedIDs = [];
      comp.features = [];
    }
    // 👉 when the sidebar closes, stop listening
    this.drawer.closedStart.subscribe(() => {
      unByKey(key);
    });
  }

  abstract getType(): MapType;
}
