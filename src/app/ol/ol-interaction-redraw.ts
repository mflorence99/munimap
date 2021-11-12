import { AddParcels } from '../state/parcels';
import { AuthState } from '../state/auth';
import { ConfirmDialogComponent } from '../components/confirm-dialog';
import { ConfirmDialogData } from '../components/confirm-dialog';
import { DestroyService } from '../services/destroy';
import { OLLayerVectorComponent } from './ol-layer-vector';
import { OLMapComponent } from './ol-map';
import { Parcel } from '../common';

import { AfterContentInit } from '@angular/core';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { EventsKey as OLEventsKey } from 'ol/events';
import { MatDialog } from '@angular/material/dialog';
import { Store } from '@ngxs/store';

import { takeUntil } from 'rxjs/operators';
import { unByKey } from 'ol/Observable';

import copy from 'fast-copy';
import OLCollection from 'ol/Collection';
import OLFeature from 'ol/Feature';
import OLGeoJSON from 'ol/format/GeoJSON';
import OLModify from 'ol/interaction/Modify';
import OLMultiPolygon from 'ol/geom/MultiPolygon';
import OLPolygon from 'ol/geom/Polygon';
import OLSnap from 'ol/interaction/Snap';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-interaction-redraw',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none; }']
})
export class OLInteractionRedrawComponent implements AfterContentInit {
  #feature: OLFeature<OLPolygon | OLMultiPolygon>;
  #format: OLGeoJSON;
  #geometry: OLPolygon | OLMultiPolygon;
  #modifyStartKey: OLEventsKey = null;
  #touched = false;

  active = false;

  olModify: OLModify;
  olSnap: OLSnap;

  constructor(
    private authState: AuthState,
    private dialog: MatDialog,
    private destroy$: DestroyService,
    private layer: OLLayerVectorComponent,
    private map: OLMapComponent,
    private store: Store
  ) {
    this.#format = new OLGeoJSON({
      dataProjection: this.map.featureProjection,
      featureProjection: this.map.projection
    });
    // 👉 register this redrawer with the map
    this.map.redrawer = this;
  }

  // 👇 the idea is that a selection change stops the redraw

  #handleFeaturesSelected$(): void {
    this.map.selector.featuresSelected
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.#touched) this.#saveRedraw();
        if (this.#modifyStartKey) unByKey(this.#modifyStartKey);
        if (this.olModify) this.map.olMap.removeInteraction(this.olModify);
        if (this.olSnap) this.map.olMap.removeInteraction(this.olSnap);
        this.#touched = false;
        this.active = false;
      });
  }

  #saveRedraw(): void {
    const data: ConfirmDialogData = {
      content: `Do you want to save the new parcel boundary for ${this.#feature.getId()}?`,
      title: 'Please confirm new boundary'
    };
    this.dialog
      .open(ConfirmDialogComponent, { data, width: '25rem' })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          const geojson = JSON.parse(this.#format.writeFeature(this.#feature));
          const redrawnParcel: Parcel = {
            action: 'modified',
            geometry: geojson.geometry,
            id: this.#feature.getId(),
            owner: this.authState.currentProfile().email,
            path: this.map.path,
            type: 'Feature'
          };
          this.store.dispatch(new AddParcels([redrawnParcel]));
        }
        // 👉 on CANCEL, reset geometry
        else this.#feature.setGeometry(this.#geometry);
      });
  }

  ngAfterContentInit(): void {
    this.#handleFeaturesSelected$();
  }

  setFeature(feature: OLFeature<OLPolygon | OLMultiPolygon>): void {
    this.active = true;
    this.#feature = feature;
    // 👇 copy the geometry so we can restore it if redraw cancelled
    this.#geometry = copy(feature.getGeometry());
    // 👇 create a standard OL Modify interaction
    const features = new OLCollection([feature]);
    this.olModify = new OLModify({ features });
    this.#modifyStartKey = this.olModify.on(
      'modifystart',
      () => (this.#touched = true)
    );
    this.map.olMap.addInteraction(this.olModify);
    // 👇 create a standard OL Snap interaction
    this.olSnap = new OLSnap({ source: this.layer.olLayer.getSource() });
    this.map.olMap.addInteraction(this.olSnap);
  }
}
