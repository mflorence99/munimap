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
import { OLInteractionDrawLandmarksComponent } from '@lib/ol/landmarks/ol-interaction-drawlandmarks';
import { OLInteractionRedrawLandmarkComponent } from '@lib/ol/landmarks/ol-interaction-redrawlandmark';
import { OLOverlayLandmarkLabelComponent } from '@lib/ol/landmarks/ol-overlay-landmarklabel';
import { Router } from '@angular/router';
import { Store } from '@ngxs/store';
import { ViewChild } from '@angular/core';
import { ViewState } from '@lib/state/view';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DestroyService],
  selector: 'app-property',
  styleUrls: ['../abstract-map.scss', './page.scss'],
  templateUrl: './page.html'
})
export class PropertyPage extends AbstractMapPage {
  @ViewChild(OLInteractionDrawLandmarksComponent)
  drawLandmarks: OLInteractionDrawLandmarksComponent;

  @ViewChild(OLOverlayLandmarkLabelComponent)
  moveLandmark: OLOverlayLandmarkLabelComponent;

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

  canDeleteLandmarks(event?: MouseEvent): boolean {
    return this.#can(event, this.olMap.selected.length > 0);
  }

  canDrawLandmarks(event?: MouseEvent): boolean {
    return this.#can(event, this.olMap.selected.length === 0);
  }

  canMoveLandmark(event?: MouseEvent): boolean {
    const feature = this.olMap.selected[0];
    return this.#can(
      event,
      this.olMap.selected.length === 1 &&
        feature.get('name') &&
        ['Point', 'Polygon'].includes(feature.getGeometry().getType())
    );
  }

  canRedrawLandmark(event?: MouseEvent): boolean {
    const feature = this.olMap.selected[0];
    return this.#can(
      event,
      this.olMap.selected.length === 1 &&
        ['LineString', 'Polygon'].includes(feature.getGeometry().getType())
    );
  }

  eatMe(event: Event): void {
    event.stopPropagation();
  }

  getType(): MapType {
    return 'property';
  }

  onContextMenu(key: string, opaque?: string): void {
    let cFactory: ComponentFactory<SidebarComponent>;
    switch (key) {
      case 'delete-landmark':
        this.store.dispatch(
          this.olMap.selectedIDs.map((id) => new DeleteLandmark({ id }))
        );
        break;
      case 'draw-landmarks':
        this.drawLandmarks.startDraw(opaque);
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
