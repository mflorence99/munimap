import { AbstractMapPage } from '../abstract-map';
import { AddParcelComponent } from './add-parcel';
import { ContextMenuComponent } from '../contextmenu-component';
import { ContextMenuHostDirective } from '../contextmenu-host';
import { CreatePropertyMapComponent } from './create-propertymap';
import { MergeParcelsComponent } from './merge-parcels';
import { ParcelPropertiesComponent } from './parcel-properties';
import { RootPage } from '../root/page';
import { SubdivideParcelComponent } from './subdivide-parcel';

import { Actions } from '@ngxs/store';
import { ActivatedRoute } from '@angular/router';
import { AuthState } from '@lib/state/auth';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { ComponentFactory } from '@angular/core';
import { ComponentFactoryResolver } from '@angular/core';
import { ComponentRef } from '@angular/core';
import { DestroyService } from '@lib/services/destroy';
import { MapType } from '@lib/state/map';
import { MatDrawer } from '@angular/material/sidenav';
import { OLInteractionRedrawParcelComponent } from '@lib/ol/parcels/ol-interaction-redrawparcel';
import { OLInteractionSelectParcelsComponent } from '@lib/ol/parcels/ol-interaction-selectparcels';
import { OLOverlayParcelLabelComponent } from '@lib/ol/parcels/ol-overlay-parcellabel';
import { Router } from '@angular/router';
import { Store } from '@ngxs/store';
import { ViewChild } from '@angular/core';
import { ViewState } from '@lib/state/view';

import { unByKey } from 'ol/Observable';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DestroyService],
  selector: 'app-parcels',
  styleUrls: ['../abstract-map.scss'],
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
    // 👉 there really should be a selector, or else we couldn't be here
    let key;
    const selector = this.olMap.selector as OLInteractionSelectParcelsComponent;
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

  canAddParcel(event?: MouseEvent): boolean {
    return this.#can(event, this.olMap.selectedIDs.length === 0);
  }

  canCreatePropertyMap(event?: MouseEvent): boolean {
    return this.#can(event, this.olMap.selectedIDs.length >= 1);
  }

  canMergeParcels(event?: MouseEvent): boolean {
    return this.#can(event, this.olMap.selectedIDs.length > 1);
  }

  canParcelProperties(event?: MouseEvent): boolean {
    return this.#can(event, this.olMap.selectedIDs.length > 0);
  }

  canRecenterLabel(event?: MouseEvent): boolean {
    return this.#can(event, this.olMap.selectedIDs.length === 1);
  }

  canRedrawBoundary(event?: MouseEvent): boolean {
    return this.#can(event, this.olMap.selectedIDs.length === 1);
  }

  canSubdivideParcel(event?: MouseEvent): boolean {
    return this.#can(event, this.olMap.selectedIDs.length === 1);
  }

  getType(): MapType {
    return 'parcels';
  }

  onContextMenu(key: string): void {
    let cFactory: ComponentFactory<ContextMenuComponent>;
    switch (key) {
      case 'add-parcel':
        cFactory = this.resolver.resolveComponentFactory(AddParcelComponent);
        break;
      case 'create-propertymap':
        cFactory = this.resolver.resolveComponentFactory(
          CreatePropertyMapComponent
        );
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
        this.overlayLabel.setFeature(this.olMap.selected[0]);
        break;
      case 'redraw-boundary':
        this.interactionRedraw.setFeature(this.olMap.selected[0]);
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
