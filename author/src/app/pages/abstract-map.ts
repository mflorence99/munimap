import { ContextMenuHostDirective } from '../directives//contextmenu-host';
import { RootPage } from './root/page';
import { SidebarComponent } from '../components/sidebar-component';

import { Actions } from '@ngxs/store';
import { ActivatedRoute } from '@angular/router';
import { AuthState } from '@lib/state/auth';
import { ComponentRef } from '@angular/core';
import { DestroyService } from '@lib/services/destroy';
import { LoadMap } from '@lib/state/map';
import { Map } from '@lib/state/map';
import { MapType } from '@lib/state/map';
import { MatDrawer } from '@angular/material/sidenav';
import { OLMapComponent } from '@lib/ol/ol-map';
import { Router } from '@angular/router';
import { SetMap } from '@lib/state/map';
import { Signal } from '@angular/core';
import { Store } from '@ngxs/store';
import { Type } from '@angular/core';
import { ViewState } from '@lib/state/view';

import { environment } from '@lib/environment';
import { inject } from '@angular/core';
import { ofActionSuccessful } from '@ngxs/store';
import { takeUntil } from 'rxjs/operators';
import { unByKey } from 'ol/Observable';

import OLGeoJSON from 'ol/format/GeoJSON';

export abstract class AbstractMapPage {
  actions$ = inject(Actions);
  authState = inject(AuthState);
  creating = false;
  destroy$ = inject(DestroyService);
  env = environment;
  root = inject(RootPage);
  route = inject(ActivatedRoute);
  router = inject(Router);
  store = inject(Store);
  viewState = inject(ViewState);

  abstract contextMenuHost: Signal<ContextMenuHostDirective>;
  abstract drawer: Signal<MatDrawer>;
  abstract olMap: Signal<OLMapComponent>;

  getGeoJSONFormatter(): OLGeoJSON {
    return new OLGeoJSON({
      dataProjection: this.olMap().featureProjection,
      featureProjection: this.olMap().projection
    });
  }

  // 🔥 a very hacked up definition of privileged!
  isPrivileged(): boolean {
    return /^mflo999.*@gmail\.com$/.test(this.authState.currentProfile().email);
  }

  onContextMenuImpl(component: Type<SidebarComponent>): void {
    this.drawer().open();
    this.contextMenuHost().vcRef.clear();
    const cRef: ComponentRef<SidebarComponent> =
      this.contextMenuHost().vcRef.createComponent(component);
    // 👉 populate @Input() fields
    const comp = cRef.instance;
    comp.drawer = this.drawer();
    comp.map = this.olMap();
    let key;
    const selector = this.olMap().selector();
    if (selector) {
      // 👉 the layer that contains the selector contains the features
      //    that can be operated on
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
    this.drawer().closedStart.subscribe(() => {
      unByKey(key);
    });
  }

  onInit(): void {
    this.#handleActions$();
    this.#loadMap();
  }

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

  abstract getType(): MapType;
}
