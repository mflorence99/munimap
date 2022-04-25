import { ConfirmDialogComponent } from '../../components/confirm-dialog';
import { ConfirmDialogData } from '../../components/confirm-dialog';
import { DestroyService } from '../../services/destroy';
import { Landmark } from '../../common';
import { OLLayerVectorComponent } from '../ol-layer-vector';
import { OLMapComponent } from '../ol-map';
import { UpdateLandmark } from '../../state/landmarks';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { EventsKey as OLEventsKey } from 'ol/events';
import { MatDialog } from '@angular/material/dialog';
import { OnDestroy } from '@angular/core';
import { OnInit } from '@angular/core';
import { Store } from '@ngxs/store';

import { click } from 'ol/events/condition';
import { merge } from 'rxjs';
import { platformModifierKeyOnly } from 'ol/events/condition';
import { takeUntil } from 'rxjs/operators';
import { unByKey } from 'ol/Observable';

import copy from 'fast-copy';
import OLCollection from 'ol/Collection';
import OLFeature from 'ol/Feature';
import OLGeoJSON from 'ol/format/GeoJSON';
import OLLineString from 'ol/geom/LineString';
import OLModify from 'ol/interaction/Modify';
import OLMultiLineString from 'ol/geom/MultiLineString';
import OLMultiPolygon from 'ol/geom/MultiPolygon';
import OLPolygon from 'ol/geom/Polygon';
import OLSnap from 'ol/interaction/Snap';

// 🔥 this is substantially the same as ol-interaction-redrawparcel
//    refactor ??

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-interaction-redrawlandmark',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLInteractionRedrawLandmarkComponent implements OnDestroy, OnInit {
  #feature: OLFeature<
    OLLineString | OLMultiLineString | OLPolygon | OLMultiPolygon
  >;
  #format: OLGeoJSON;
  #geometry: OLLineString | OLMultiLineString | OLPolygon | OLMultiPolygon;
  #modifyStartKey: OLEventsKey;
  #touched = false;

  olModify: OLModify;
  olSnap: OLSnap;

  constructor(
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
  }

  // 👇 the idea is that a selection change or ESC accepts the redraw

  #handleStreams$(): void {
    merge(this.map.escape$, this.map.featuresSelected)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.#touched) this.#saveRedraw();
        this.#unsetFeature();
      });
  }

  #resetRedraw(): void {
    this.#feature.setGeometry(this.#geometry);
  }

  #saveRedraw(): void {
    const data: ConfirmDialogData = {
      content: `Do you want to save the new landmark alignment for ${this.#feature.get(
        'name'
      )}?`,
      title: 'Please confirm new alignment'
    };
    this.dialog
      .open(ConfirmDialogComponent, { data })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          const geojson = JSON.parse(this.#format.writeFeature(this.#feature));
          // 👉 update the store
          const redrawnLandmark: Partial<Landmark> = {
            id: this.#feature.getId() as string,
            geometry: geojson.geometry,
            type: 'Feature'
          };
          this.store.dispatch(new UpdateLandmark(redrawnLandmark));
        }
        // 👉 on CANCEL, reset geometry
        else this.#resetRedraw();
      });
  }

  #unsetFeature(): void {
    if (this.#modifyStartKey) unByKey(this.#modifyStartKey);
    if (this.olModify) this.map.olMap.removeInteraction(this.olModify);
    if (this.olSnap) this.map.olMap.removeInteraction(this.olSnap);
    if (this.#feature) this.#feature.set('ol-interaction-redraw', false);
    this.#touched = false;
  }

  ngOnDestroy(): void {
    this.#unsetFeature();
  }

  ngOnInit(): void {
    this.#handleStreams$();
  }

  // 👉 setFeature is called by the contextmenu code to initiate
  //    this interaction

  setFeature(feature: OLFeature<OLPolygon | OLMultiPolygon>): void {
    this.#feature = feature;
    // 🔥 pretty hack back door -- see ol-style-universal.ts
    this.#feature.set('ol-interaction-redraw', true);
    // 👇 copy the geometry so we can restore it if redraw cancelled
    this.#geometry = copy(feature.getGeometry());
    // 👇 create a standard OL Modify interaction
    const features = new OLCollection([feature]);
    this.olModify = new OLModify({
      deleteCondition: (event): boolean =>
        click(event) && platformModifierKeyOnly(event),
      features,
      hitDetection: this.layer.olLayer
    });
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
