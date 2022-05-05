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
import { Landmark } from '@lib/common';
import { MapType } from '@lib/state/map';
import { OLInteractionDrawLandmarksComponent } from '@lib/ol/landmarks/ol-interaction-drawlandmarks';
import { OLInteractionRedrawLandmarkComponent } from '@lib/ol/landmarks/ol-interaction-redrawlandmark';
import { OLOverlayLandmarkLabelComponent } from '@lib/ol/landmarks/ol-overlay-landmarklabel';
import { Router } from '@angular/router';
import { Store } from '@ngxs/store';
import { UpdateLandmark } from '@lib/state/landmarks';
import { ViewChild } from '@angular/core';
import { ViewState } from '@lib/state/view';

import { calculateOrientation } from '@lib/common';

import bbox from '@turf/bbox';
import bboxPolygon from '@turf/bbox-polygon';
import OLFeature from 'ol/Feature';
import transformRotate from '@turf/transform-rotate';

interface LandmarkConversion {
  converter: (feature: OLFeature<any>) => void;
  geometryType: 'Point' | 'LineString' | 'Polygon';
  label: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DestroyService],
  selector: 'app-property',
  styleUrls: ['../abstract-map.scss', './page.scss'],
  templateUrl: './page.html'
})
export class PropertyPage extends AbstractMapPage {
  conversions: LandmarkConversion[] = [
    {
      converter: this.convertToBuilding.bind(this),
      geometryType: 'Polygon',
      label: 'building'
    }
  ];

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

  canConvertFor(conversion: LandmarkConversion): boolean {
    const feature = this.olMap.selected[0];
    return (
      this.olMap.selected.length === 1 &&
      conversion.geometryType === feature.getGeometry().getType()
    );
  }

  canConvertLandmark(event?: MouseEvent): boolean {
    return this.#can(event, this.olMap.selected.length === 1);
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

  convertToBuilding(feature: OLFeature<any>): void {
    const formatter = this.getGeoJSONFormatter();
    const geojson = JSON.parse(formatter.writeFeature(feature));
    // 👇 calculate the orientation of the building outline
    const theta = calculateOrientation(geojson);
    // 👇 rotate it level, expand to bbox, then rotate it back
    let munged = transformRotate(geojson, theta * -1);
    munged = bboxPolygon(bbox(munged));
    munged = transformRotate(munged, theta);
    // 👉 update the store
    const landmark: Partial<Landmark> = {
      id: feature.getId() as string,
      geometry: munged.geometry,
      properties: {
        fillColor: '--map-building-fill',
        fillOpacity: 1,
        fontColor: '--map-building-outline',
        fontOpacity: 1,
        fontOutline: true,
        fontSize: 'medium',
        fontStyle: 'italic',
        shadowColor: '--map-building-outline',
        shadowOffsetFeet: [6, -6],
        shadowOpacity: 0.75,
        showDimension: false,
        strokeColor: '--map-building-outline',
        strokeOpacity: 1,
        strokePixels: 1,
        strokeStyle: 'solid'
      },
      type: 'Feature'
    };
    this.store.dispatch(new UpdateLandmark(landmark));
  }

  getType(): MapType {
    return 'property';
  }

  onContextMenu(key: string, opaque?: any): void {
    let cFactory: ComponentFactory<SidebarComponent>;
    switch (key) {
      case 'convert-landmark':
        if (opaque) {
          const conversion = this.conversions.find(
            (conversion) => conversion.label === opaque
          );
          conversion?.converter?.(this.olMap.selected[0]);
        }
        break;
      case 'delete-landmark':
        this.store.dispatch(
          this.olMap.selectedIDs.map((id) => new DeleteLandmark({ id }))
        );
        break;
      case 'draw-landmarks':
        if (opaque) this.drawLandmarks.startDraw(opaque);
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
