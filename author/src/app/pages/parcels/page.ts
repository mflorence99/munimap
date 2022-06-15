import { AbstractMapPage } from '../abstract-map';
import { AddParcelComponent } from './add-parcel';
import { CreatePropertyMapComponent } from './create-propertymap';
import { MergeParcelsComponent } from './merge-parcels';
import { ParcelPropertiesComponent } from './parcel-properties';
import { RootPage } from '../root/page';
import { SidebarComponent } from '../../components/sidebar-component';
import { SubdivideParcelComponent } from './subdivide-parcel';

import { Actions } from '@ngxs/store';
import { ActivatedRoute } from '@angular/router';
import { AuthState } from '@lib/state/auth';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { ComponentFactory } from '@angular/core';
import { ComponentFactoryResolver } from '@angular/core';
import { ContextMenuHostDirective } from 'app/directives/contextmenu-host';
import { DestroyService } from '@lib/services/destroy';
import { Map } from '@lib/state/map';
import { MapState } from '@lib/state/map';
import { MapType } from '@lib/state/map';
import { MatDrawer } from '@angular/material/sidenav';
import { Observable } from 'rxjs';
import { OLInteractionRedrawParcelComponent } from '@lib/ol/parcels/ol-interaction-redrawparcel';
import { OLMapComponent } from '@lib/ol/ol-map';
import { OLOverlayParcelLabelComponent } from '@lib/ol/parcels/ol-overlay-parcellabel';
import { OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Select } from '@ngxs/store';
import { Store } from '@ngxs/store';
import { ViewChild } from '@angular/core';
import { ViewState } from '@lib/state/view';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DestroyService],
  selector: 'app-parcels',
  styleUrls: ['../abstract-map.scss'],
  templateUrl: './page.html'
})
export class ParcelsPage extends AbstractMapPage implements OnInit {
  @ViewChild(ContextMenuHostDirective)
  contextMenuHost: ContextMenuHostDirective;

  @ViewChild('drawer') drawer: MatDrawer;

  @ViewChild(OLInteractionRedrawParcelComponent)
  interactionRedraw: OLInteractionRedrawParcelComponent;

  @Select(MapState) mapState$: Observable<Map>;

  @ViewChild(OLMapComponent) olMap: OLMapComponent;

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

  ngOnInit(): void {
    this.onInit();
  }

  onContextMenu(key: string): void {
    let cFactory: ComponentFactory<SidebarComponent>;
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
    if (cFactory) this.onContextMenuImpl(cFactory);
  }
}
