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
import { AddParcels } from '@lib/state/parcels';
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
import { Parcel } from '@lib/common';
import { ParcelPropertiesLabel } from '@lib/common';
import { Router } from '@angular/router';
import { Select } from '@ngxs/store';
import { Store } from '@ngxs/store';
import { ViewChild } from '@angular/core';
import { ViewState } from '@lib/state/view';

import { calculateParcel } from '@lib/common';
import { fromLonLat } from 'ol/proj';
import { point } from '@turf/helpers';
import { polygon } from '@turf/helpers';
import { toLonLat } from 'ol/proj';

import bbox from '@turf/bbox';
import bboxPolygon from '@turf/bbox-polygon';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import circle from '@turf/circle';
import OLFeature from 'ol/Feature';
import OLGeoJSON from 'ol/format/GeoJSON';
import OLMultiPolygon from 'ol/geom/MultiPolygon';

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

  canAddParcel(event?: MouseEvent): boolean {
    return this.#can(event, this.olMap.selectedIDs.length === 0);
  }

  canAddPolygon(event?: MouseEvent): boolean {
    return this.#can(event, this.olMap.selectedIDs.length === 1);
  }

  canCreatePropertyMap(event?: MouseEvent): boolean {
    return this.#can(event, this.olMap.selectedIDs.length >= 1);
  }

  canDeletePolygon(event?: MouseEvent): boolean {
    return this.#can(
      event,
      this.olMap.selectedIDs.length === 1 &&
        this.olMap.selected[0].getGeometry().getType() === 'MultiPolygon'
    );
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

  canRotateLabel(event?: MouseEvent): boolean {
    return this.#can(event, this.olMap.selectedIDs.length === 1);
  }

  canSplitLabel(event?: MouseEvent): boolean {
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
      case 'add-polygon':
        this.#addPolygon(this.olMap.selected[0]);
        break;
      case 'create-propertymap':
        cFactory = this.resolver.resolveComponentFactory(
          CreatePropertyMapComponent
        );
        break;
      case 'delete-polygon':
        this.#deletePolygon(this.olMap.selected[0]);
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
      case 'rotate-label':
        this.#rotateLabel(this.olMap.selected[0]);
        break;
      case 'split-label':
        this.#splitLabel(this.olMap.selected[0]);
        break;
      case 'subdivide-parcel':
        cFactory = this.resolver.resolveComponentFactory(
          SubdivideParcelComponent
        );
        break;
    }
    if (cFactory) this.onContextMenuImpl(cFactory);
  }

  #addPolygon(feature: OLFeature<any>): void {
    if (feature.getGeometry().getType() === 'Polygon')
      feature.setGeometry(
        new OLMultiPolygon([feature.getGeometry().getCoordinates()])
      );
    // 👇 create a square centered on the context menu
    const polygon = bboxPolygon(
      bbox(
        circle(toLonLat(this.olMap.contextMenuAt), 100, {
          steps: 16,
          units: 'feet'
        })
      )
    );
    // 👇 add the new polygon to the feature
    const coords = feature.getGeometry().getCoordinates();
    coords.push([
      polygon.geometry.coordinates[0].map((coord: any) => fromLonLat(coord))
    ]);
    feature.getGeometry().setCoordinates(coords);
    this.#modifyFeature(feature, true, false);
  }

  #can(event: MouseEvent, condition: boolean): boolean {
    if (!condition && event) event.stopPropagation();
    return condition;
  }

  #deletePolygon(feature: OLFeature<any>): void {
    const coords = feature.getGeometry().getCoordinates();
    coords.splice(this.#whichPolygon(feature), 1);
    feature.getGeometry().setCoordinates(coords);
    this.#modifyFeature(feature, true, false);
  }

  #modifyFeature(
    feature: OLFeature<any>,
    doGeometry = false,
    doProperties = false
  ): void {
    const format = new OLGeoJSON({
      dataProjection: this.olMap.featureProjection,
      featureProjection: this.olMap.projection
    });
    // 👉 convert to feature to geojson and recalculate centers etc
    const parcel = JSON.parse(format.writeFeature(feature));
    calculateParcel(parcel);
    feature.setProperties(parcel.properties);
    // 👉 record the modification
    const redrawnParcel: Parcel = {
      action: 'modified',
      geometry: doGeometry ? parcel.geometry : null,
      id: feature.getId(),
      owner: this.authState.currentProfile().email,
      path: this.olMap.path,
      properties: doProperties ? parcel.properties : null,
      type: 'Feature'
    };
    this.store.dispatch(new AddParcels([redrawnParcel]));
  }

  #rotateLabel(feature: OLFeature<any>): void {
    const ix = this.#whichPolygon(feature);
    const labels: ParcelPropertiesLabel[] =
      feature.getProperties().labels ?? [];
    const label: ParcelPropertiesLabel = labels[ix] ?? {
      split: null,
      rotate: null
    };
    label.rotate = label.rotate ? false : true;
    labels[ix] = label;
    feature.setProperties({ labels });
    this.#modifyFeature(feature, false, true);
  }

  #splitLabel(feature: OLFeature<any>): void {
    const ix = this.#whichPolygon(feature);
    const labels: ParcelPropertiesLabel[] =
      feature.getProperties().labels ?? [];
    const label: ParcelPropertiesLabel = labels[ix] ?? {
      split: null,
      rotate: null
    };
    label.split = label.split ? null : true;
    labels[ix] = label;
    feature.setProperties({ labels });
    this.#modifyFeature(feature, false, true);
  }

  #whichPolygon(feature: OLFeature<any>): number {
    let ix = 0;
    if (feature.getGeometry().getType() === 'MultiPolygon') {
      const polygons = feature.getGeometry().getPolygons();
      for (ix = 0; ix < polygons.length; ix++) {
        const pt = point(this.olMap.contextMenuAt);
        const poly = polygon([polygons[ix].getCoordinates()[0]]);
        if (booleanPointInPolygon(pt, poly)) break;
      }
    }
    return ix;
  }
}
