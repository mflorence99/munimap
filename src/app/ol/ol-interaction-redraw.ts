import { AddParcels } from '../state/parcels';
import { AuthState } from '../state/auth';
import { ConfirmDialogComponent } from '../components/confirm-dialog';
import { ConfirmDialogData } from '../components/confirm-dialog';
import { DestroyService } from '../services/destroy';
import { OLMapComponent } from './ol-map';
import { Parcel } from '../common';

import { AfterContentInit } from '@angular/core';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Store } from '@ngxs/store';

import { filter } from 'rxjs/operators';
import { takeUntil } from 'rxjs/operators';
import { unByKey } from 'ol/Observable';

import copy from 'fast-copy';
import OLCollection from 'ol/Collection';
import OLFeature from 'ol/Feature';
import OLGeoJSON from 'ol/format/GeoJSON';
import OLModify from 'ol/interaction/Modify';
import OLMultiPolygon from 'ol/geom/MultiPolygon';
import OLPolygon from 'ol/geom/Polygon';

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
  #modifyEndKey: any;
  #touched = false;

  active = false;

  olModify: OLModify;

  constructor(
    private authState: AuthState,
    private dialog: MatDialog,
    private destroy$: DestroyService,
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
      .pipe(
        takeUntil(this.destroy$),
        // 👇 ignore selection changes to the feature we've
        //    been redrawing
        filter(
          (selected) =>
            selected.length !== 1 ||
            selected[0].getId() !== this.#feature?.getId()
        )
      )
      .subscribe(() => {
        if (this.#touched) this.#saveRedraw();
        if (this.#modifyEndKey) unByKey(this.#modifyEndKey);
        if (this.olModify) this.map.olMap.removeInteraction(this.olModify);
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
    this.#modifyEndKey = this.olModify.on(
      'modifyend',
      () => (this.#touched = true)
    );
    this.map.olMap.addInteraction(this.olModify);
  }
}
