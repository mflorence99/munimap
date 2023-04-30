import { AbstractMapPage } from '../abstract-map';
import { CulvertPropertiesComponent } from './culvert-properties';
import { ImportCulvertsComponent } from './import-culverts';
import { RootPage } from '../root/page';

import { Actions } from '@ngxs/store';
import { ActivatedRoute } from '@angular/router';
import { AddLandmark } from '@lib/state/landmarks';
import { AuthState } from '@lib/state/auth';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { ComponentFactory } from '@angular/core';
import { ComponentFactoryResolver } from '@angular/core';
import { ContextMenuComponent } from 'app/components/contextmenu';
import { ContextMenuHostDirective } from 'app/directives/contextmenu-host';
import { CulvertProperties } from '@lib/common';
import { DeleteLandmark } from '@lib/state/landmarks';
import { DestroyService } from '@lib/services/destroy';
import { Landmark } from '@lib/common';
import { Map } from '@lib/state/map';
import { MapState } from '@lib/state/map';
import { MapType } from '@lib/state/map';
import { MatDrawer } from '@angular/material/sidenav';
import { Observable } from 'rxjs';
import { OLMapComponent } from '@lib/ol/ol-map';
import { OLOverlayLandmarkLabelComponent } from '@lib/ol/landmarks/ol-overlay-landmarklabel';
import { OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Select } from '@ngxs/store';
import { SidebarComponent } from 'app/components/sidebar-component';
import { Store } from '@ngxs/store';
import { ViewChild } from '@angular/core';
import { ViewState } from '@lib/state/view';

import { culvertConditions } from '@lib/common';
import { culvertFloodHazards } from '@lib/common';
import { culvertHeadwalls } from '@lib/common';
import { culvertMaterials } from '@lib/common';
import { makeLandmarkID } from '@lib/common';
import { toLonLat } from 'ol/proj';

// 🔥 only culverts are supported for now

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DestroyService],
  selector: 'app-dpw',
  styleUrls: ['../abstract-map.scss'],
  templateUrl: './page.html'
})
export class DPWPage extends AbstractMapPage implements OnInit {
  @ViewChild(ContextMenuComponent) contextMenu: ContextMenuComponent;

  @ViewChild(ContextMenuHostDirective)
  contextMenuHost: ContextMenuHostDirective;

  @ViewChild('drawer') drawer: MatDrawer;

  @Select(MapState) mapState$: Observable<Map>;

  @ViewChild(OLOverlayLandmarkLabelComponent)
  moveLandmark: OLOverlayLandmarkLabelComponent;

  @ViewChild(OLMapComponent) olMap: OLMapComponent;

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

  canAddCulvert(event?: MouseEvent): boolean {
    return this.#can(event, true);
  }

  canCulvertProperties(event?: MouseEvent): boolean {
    return this.#can(
      event,
      !this.olMap.roSelection && this.olMap.selected.length === 1
    );
  }

  canDeleteCulvert(event?: MouseEvent): boolean {
    return this.#can(
      event,
      !this.olMap.roSelection && this.olMap.selected.length === 1
    );
  }

  canImportCulverts(event?: MouseEvent): boolean {
    return this.#can(event, true);
  }

  canMoveCulvert(event?: MouseEvent): boolean {
    return this.#can(
      event,
      !this.olMap.roSelection && this.olMap.selected.length === 1
    );
  }

  getType(): MapType {
    return 'dpw';
  }

  ngOnInit(): void {
    this.onInit();
  }

  onContextMenu(key: string): void {
    let cFactory: ComponentFactory<SidebarComponent>;
    switch (key) {
      case 'add-culvert':
        this.#createCulvert();
        break;
      case 'delete-culvert':
        this.store.dispatch(
          new DeleteLandmark({ id: this.olMap.selectedIDs[0] })
        );
        break;
      case 'import-culverts':
        cFactory = this.resolver.resolveComponentFactory(
          ImportCulvertsComponent
        );
        break;
      case 'culvert-properties':
        cFactory = this.resolver.resolveComponentFactory(
          CulvertPropertiesComponent
        );
        break;
      case 'move-culvert':
        this.moveLandmark.setFeature(this.olMap.selected[0]);
        break;
    }
    if (cFactory) this.onContextMenuImpl(cFactory);
    // 👇 in some cases, doesn't close itself
    this.contextMenu.closeMenu();
  }

  #can(event: MouseEvent, condition: boolean): boolean {
    if (!condition && event) event.stopPropagation();
    return condition;
  }

  #createCulvert(): void {
    const landmark: Partial<Landmark> = {
      geometry: {
        coordinates: toLonLat(this.olMap.contextMenuAt),
        type: 'Point'
      },
      owner: this.authState.currentProfile().email,
      path: this.olMap.path,
      properties: {
        metadata: {
          condition: culvertConditions[0],
          count: 1,
          diameter: 12,
          floodHazard: culvertFloodHazards[0],
          headwall: culvertHeadwalls[0],
          length: 20,
          material: culvertMaterials[0],
          type: 'culvert',
          year: null
        } as Partial<CulvertProperties>
      },
      type: 'Feature'
    };
    landmark.id = makeLandmarkID(landmark);
    this.store.dispatch(new AddLandmark(landmark));
  }
}
