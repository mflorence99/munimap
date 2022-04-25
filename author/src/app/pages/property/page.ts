import { AbstractMapPage } from '../abstract-map';
import { RootPage } from '../root/page';
import { SidebarComponent } from '../../components/sidebar-component';

import { Actions } from '@ngxs/store';
import { ActivatedRoute } from '@angular/router';
import { AuthState } from '@lib/state/auth';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { ComponentFactory } from '@angular/core';
import { ComponentFactoryResolver } from '@angular/core';
import { DeleteLandmark } from '@lib/state/landmarks';
import { DestroyService } from '@lib/services/destroy';
import { MapType } from '@lib/state/map';
import { OLInteractionRedrawLandmarkComponent } from '@lib/ol/landmarks/ol-interaction-redrawlandmark';
import { OLOverlayMoveLandmarkComponent } from '@lib/ol/landmarks/ol-overlay-movelandmark';
import { Router } from '@angular/router';
import { Store } from '@ngxs/store';
import { ViewChild } from '@angular/core';
import { ViewState } from '@lib/state/view';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DestroyService],
  selector: 'app-property',
  styleUrls: ['../abstract-map.scss'],
  templateUrl: './page.html'
})
export class PropertyPage extends AbstractMapPage {
  @ViewChild(OLOverlayMoveLandmarkComponent)
  moveLandmark: OLOverlayMoveLandmarkComponent;

  @ViewChild(OLInteractionRedrawLandmarkComponent)
  redrawLandmark: OLInteractionRedrawLandmarkComponent;

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

  canDeleteLandmark(event?: MouseEvent): boolean {
    return this.#can(event, this.olMap.selected.length === 1);
  }

  canMoveLandmark(event?: MouseEvent): boolean {
    return this.#can(
      event,
      this.olMap.selected.length === 1 &&
        this.olMap.selected[0].getGeometry().getType() === 'Point'
    );
  }

  canRedrawLandmark(event?: MouseEvent): boolean {
    return this.#can(
      event,
      this.olMap.selected.length === 1 &&
        ['LineString', 'MultiLineString', 'Polygon', 'MultiPolygon'].includes(
          this.olMap.selected[0].getGeometry().getType()
        )
    );
  }

  getType(): MapType {
    return 'property';
  }

  onContextMenu(key: string): void {
    let cFactory: ComponentFactory<SidebarComponent>;
    switch (key) {
      case 'delete-landmark':
        this.store.dispatch(
          new DeleteLandmark({ id: this.olMap.selectedIDs[0] })
        );
        break;
      case 'move-landmark':
        this.moveLandmark.setFeature(this.olMap.selected[0]);
        break;
      case 'redraw-landmark':
        this.redrawLandmark.setFeature(this.olMap.selected[0]);
        break;
    }
    if (cFactory) this.onContextMenuImpl(cFactory);
  }
}
