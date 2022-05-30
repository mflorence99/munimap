import { AbstractMapPage } from '../abstract-map';
import { DPWLandmarkPropertiesComponent } from './dpwlandmark-properties';
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
import { DeleteLandmark } from '@lib/state/landmarks';
import { DestroyService } from '@lib/services/destroy';
import { Landmark } from '@lib/common';
import { MapType } from '@lib/state/map';
import { OLOverlayLandmarkLabelComponent } from '@lib/ol/landmarks/ol-overlay-landmarklabel';
import { Router } from '@angular/router';
import { SidebarComponent } from 'app/components/sidebar-component';
import { Store } from '@ngxs/store';
import { StreamCrossingProperties } from '@lib/common';
import { ViewChild } from '@angular/core';
import { ViewState } from '@lib/state/view';

import { makeLandmarkID } from '@lib/common';
import { toLonLat } from 'ol/proj';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DestroyService],
  selector: 'app-dpw',
  styleUrls: ['../abstract-map.scss'],
  templateUrl: './page.html'
})
export class DPWPage extends AbstractMapPage {
  @ViewChild(ContextMenuComponent) contextMenu: ContextMenuComponent;

  @ViewChild(OLOverlayLandmarkLabelComponent)
  moveLandmark: OLOverlayLandmarkLabelComponent;

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
    return this.selectedLandmarkType() && condition;
  }

  // 🔥 only stream crossings supported for now
  #createLandmark(): void {
    const landmark: Partial<Landmark> = {
      geometry: {
        coordinates: toLonLat(this.olMap.contextMenuAt),
        type: 'Point'
      },
      owner: this.authState.currentProfile().email,
      path: this.olMap.path,
      properties: {
        metadata: {
          StructCond: 'unknown',
          name: 'Culvert',
          type: 'stream crossing'
        } as Partial<StreamCrossingProperties>
      },
      type: 'Feature'
    };
    landmark.id = makeLandmarkID(landmark);
    this.store.dispatch(new AddLandmark(landmark));
  }

  // 🔥 only stream crossings supported for now
  canAddLandmark(event?: MouseEvent): boolean {
    return this.#can(event, this.olMap.selected.length === 0);
  }

  canDeleteLandmark(event?: MouseEvent): boolean {
    return this.#can(
      event,
      !this.olMap.roSelection && this.olMap.selected.length === 1
    );
  }

  canLandmarkProperties(event?: MouseEvent): boolean {
    return this.#can(
      event,
      !this.olMap.roSelection && this.olMap.selected.length === 1
    );
  }

  canMoveLandmark(event?: MouseEvent): boolean {
    return this.#can(
      event,
      !this.olMap.roSelection && this.olMap.selected.length === 1
    );
  }

  getType(): MapType {
    return 'dpw';
  }

  onContextMenu(key: string): void {
    let cFactory: ComponentFactory<SidebarComponent>;
    switch (key) {
      case 'add-landmark':
        this.#createLandmark();
        break;
      case 'delete-landmark':
        this.store.dispatch(
          new DeleteLandmark({ id: this.olMap.selectedIDs[0] })
        );
        break;
      case 'landmark-properties':
        cFactory = this.resolver.resolveComponentFactory(
          DPWLandmarkPropertiesComponent
        );
        break;
      case 'move-landmark':
        this.moveLandmark.setFeature(this.olMap.selected[0]);
        break;
    }
    if (cFactory) this.onContextMenuImpl(cFactory);
    // 👇 in some cases, doesn't close itself
    this.contextMenu.closeMenu();
  }

  selectedLandmarkType(): string {
    const selected = this.olMap.selected[0];
    let type = 'site';
    if (selected) {
      const metadata = selected.get('metadata');
      type = metadata?.type ?? selected.get('type');
    }
    return type;
  }
}
