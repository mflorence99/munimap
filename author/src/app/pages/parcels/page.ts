import { AbstractMapPage } from '../abstract-map';
import { AddParcelComponent } from './add-parcel';
import { ContextMenuComponent } from './contextmenu-component';
import { ContextMenuHostDirective } from './contextmenu-host';
import { MergeParcelsComponent } from './merge-parcels';
import { ParcelPropertiesComponent } from './parcel-properties';
import { RootPage } from '../root/page';
import { SubdivideParcelComponent } from './subdivide-parcel';

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
import { MatDrawer } from '@angular/material/sidenav';
import { Observable } from 'rxjs';
import { OLInteractionRedrawParcelComponent } from '@lib/ol/parcels/ol-interaction-redrawparcel';
import { OLOverlayParcelLabelComponent } from '@lib/ol/parcels/ol-overlay-parcellabel';
import { Router } from '@angular/router';
import { Select } from '@ngxs/store';
import { Store } from '@ngxs/store';
import { ViewChild } from '@angular/core';
import { ViewState } from '@lib/state/view';

import { unByKey } from 'ol/Observable';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DestroyService],
  selector: 'app-parcels',
  styleUrls: ['./page.scss'],
  templateUrl: './page.html'
})
export class ParcelsPage extends AbstractMapPage {
  @ViewChild(ContextMenuHostDirective)
  contextMenuHost: ContextMenuHostDirective;

  @ViewChild('drawer') drawer: MatDrawer;

  @ViewChild(OLInteractionRedrawParcelComponent)
  interactionRedraw: OLInteractionRedrawParcelComponent;

  @ViewChild(OLOverlayParcelLabelComponent)
  overlayLabel: OLOverlayParcelLabelComponent;

  @Select(ViewState.satelliteView) satelliteView$: Observable<boolean>;

  constructor(
    protected actions$: Actions,
    protected authState: AuthState,
    protected destroy$: DestroyService,
    protected resolver: ComponentFactoryResolver,
    protected root: RootPage,
    protected route: ActivatedRoute,
    protected router: Router,
    protected store: Store,
    protected viewState: ViewState
  ) {
    super(actions$, authState, destroy$, root, route, router, store, viewState);
  }

  #can(event: MouseEvent, condition: boolean): boolean {
    if (!condition && event) event.stopPropagation();
    return condition;
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

  getType(): string {
    return 'parcels';
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
