import { AddParcelComponent } from '../../contextmenu/add-parcel';
import { ContextMenuComponent } from '../../contextmenu/contextmenu-component';
import { ContextMenuHostDirective } from '../../contextmenu/contextmenu-host';
import { MergeParcelsComponent } from '../../contextmenu/merge-parcels';
import { ParcelPropertiesComponent } from '../../contextmenu/parcel-properties';
import { RootPage } from '../root/page';
import { SubdivideParcelComponent } from '../../contextmenu/subdivide-parcel';

import { Actions } from '@ngxs/store';
import { ActivatedRoute } from '@angular/router';
import { AuthState } from '@lib/state/auth';
import { ChangeDetectionStrategy } from '@angular/core';
import { ClearStacks } from '@lib/state/parcels';
import { Component } from '@angular/core';
import { ComponentFactory } from '@angular/core';
import { ComponentFactoryResolver } from '@angular/core';
import { ComponentRef } from '@angular/core';
import { DestroyService } from '@lib/services/destroy';
import { LoadMap } from '@lib/state/map';
import { Map } from '@lib/state/map';
import { MapState } from '@lib/state/map';
import { MatDrawer } from '@angular/material/sidenav';
import { Observable } from 'rxjs';
import { OLInteractionRedrawParcelComponent } from '@lib/ol/parcels/ol-interaction-redrawparcel';
import { OLMapComponent } from '@lib/ol/ol-map';
import { OLOverlayParcelLabelComponent } from '@lib/ol/parcels/ol-overlay-parcellabel';
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

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DestroyService],
  selector: 'app-parcels',
  styleUrls: ['./page.scss'],
  templateUrl: './page.html'
})
export class ParcelsPage implements OnInit {
  @ViewChild(ContextMenuHostDirective)
  contextMenuHost: ContextMenuHostDirective;

  creating = false;

  @ViewChild('drawer') drawer: MatDrawer;

  env = environment;

  @ViewChild(OLInteractionRedrawParcelComponent)
  interactionRedraw: OLInteractionRedrawParcelComponent;

  @Select(MapState) mapState$: Observable<Map>;

  @ViewChild(OLMapComponent) olMap: OLMapComponent;

  @ViewChild(OLOverlayParcelLabelComponent)
  overlayLabel: OLOverlayParcelLabelComponent;

  constructor(
    private actions$: Actions,
    private authState: AuthState,
    private destroy$: DestroyService,
    private resolver: ComponentFactoryResolver,
    private root: RootPage,
    private route: ActivatedRoute,
    private router: Router,
    private store: Store,
    private viewState: ViewState
  ) {}

  #can(event: MouseEvent, condition: boolean): boolean {
    if (!condition && event) event.stopPropagation();
    return condition;
  }

  #handleActions$(): void {
    this.actions$
      .pipe(ofActionSuccessful(SetMap), takeUntil(this.destroy$))
      .subscribe((action: SetMap) => {
        // 👉 if we were creating a new map, once that's done rewrite the
        //    URL to the map ID so if we reload we don't enter another
        //    creating state
        if (this.creating && action.map.id && action.map.name)
          this.router.navigate([`/parcels/${action.map.id}`]);
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
      path: path ?? recentPath
    };
    // 👉 load up the requested (or default) map
    this.store.dispatch(new LoadMap(id, dflt));
    // 👉 set the window title to something we know for now
    this.root.setTitle(path);
  }

  #onContextMenu(cFactory: ComponentFactory<ContextMenuComponent>): void {
    this.drawer.open();
    this.contextMenuHost.vcRef.clear();
    const cRef: ComponentRef<ContextMenuComponent> =
      this.contextMenuHost.vcRef.createComponent(cFactory);
    // 👉 populate @Input() fields
    const comp = cRef.instance;
    comp.drawer = this.drawer;
    comp.map = this.olMap;
    // 👉 there HAS to be a selector, or else we couldn't be here
    const source = this.olMap.selector.layer.olLayer.getSource();
    comp.selectedIDs = this.olMap.selector.selectedIDs;
    comp.features = comp.selectedIDs.map((id) => source.getFeatureById(id));
    // 👉 watch for delta in features
    const key = source.on('featuresloadend', () => {
      comp.features = comp.selectedIDs.map((id) => source.getFeatureById(id));
      comp.refresh();
    });
    // 👉 when the sidebar closes, clear the undo/redo stacks if
    //    they're populated from the sidebar, or else we'll be undoing
    //    operations that are invisible to the user
    this.drawer.closedStart.subscribe(() => {
      unByKey(key);
      this.store.dispatch(new ClearStacks('fromSidebar'));
    });
  }

  canAddParcel(event?: MouseEvent): boolean {
    return this.#can(event, this.olMap.selector?.selectedIDs.length === 0);
  }

  canMergeParcels(event?: MouseEvent): boolean {
    return this.#can(event, this.olMap.selector?.selectedIDs.length > 1);
  }

  canParcelProperties(event?: MouseEvent): boolean {
    return this.#can(event, this.olMap.selector?.selectedIDs.length > 0);
  }

  canRecenterLabel(event?: MouseEvent): boolean {
    return this.#can(event, this.olMap.selector?.selectedIDs.length === 1);
  }

  canRedrawBoundary(event?: MouseEvent): boolean {
    return this.#can(event, this.olMap.selector?.selectedIDs.length === 1);
  }

  canSubdivideParcel(event?: MouseEvent): boolean {
    return this.#can(event, this.olMap.selector?.selectedIDs.length === 1);
  }

  ngOnInit(): void {
    this.#handleActions$();
    this.#loadMap();
  }

  onContextMenu(key: string): void {
    let cFactory: ComponentFactory<ContextMenuComponent>;
    switch (key) {
      case 'add-parcel':
        cFactory = this.resolver.resolveComponentFactory(AddParcelComponent);
        break;
      case 'parcel-properties':
        cFactory = this.resolver.resolveComponentFactory(
          ParcelPropertiesComponent
        );
        break;
      case 'merge-parcels':
        cFactory = this.resolver.resolveComponentFactory(MergeParcelsComponent);
        break;
      case 'recenter-label':
        this.overlayLabel.setFeature(this.olMap.selector.selected[0]);
        break;
      case 'redraw-boundary':
        this.interactionRedraw.setFeature(this.olMap.selector.selected[0]);
        break;
      case 'subdivide-parcel':
        cFactory = this.resolver.resolveComponentFactory(
          SubdivideParcelComponent
        );
        break;
    }
    if (cFactory) this.#onContextMenu(cFactory);
  }
}
