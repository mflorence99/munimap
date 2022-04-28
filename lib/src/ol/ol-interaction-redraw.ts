import { DestroyService } from '../services/destroy';
import { OLLayerVectorComponent } from './ol-layer-vector';
import { OLMapComponent } from './ol-map';

import { Component } from '@angular/core';
import { EventsKey as OLEventsKey } from 'ol/events';
import { Observable } from 'rxjs';
import { OnDestroy } from '@angular/core';
import { OnInit } from '@angular/core';

import { click } from 'ol/events/condition';
import { merge } from 'rxjs';
import { platformModifierKeyOnly } from 'ol/events/condition';
import { takeUntil } from 'rxjs/operators';
import { unByKey } from 'ol/Observable';

import cleanCoords from '@turf/clean-coords';
import copy from 'fast-copy';
import OLCollection from 'ol/Collection';
import OLFeature from 'ol/Feature';
import OLGeoJSON from 'ol/format/GeoJSON';
import OLLineString from 'ol/geom/LineString';
import OLModify from 'ol/interaction/Modify';
import OLPolygon from 'ol/geom/Polygon';
import OLSnap from 'ol/interaction/Snap';

@Component({ template: '' })
export abstract class OLInteractionRedrawComponent
  implements OnDestroy, OnInit
{
  #format: OLGeoJSON;
  #modifyStartKey: OLEventsKey;
  #touched = false;

  feature: OLFeature<OLLineString | OLPolygon>;
  geometry: OLLineString | OLPolygon;

  olModify: OLModify;
  olSnap: OLSnap;

  constructor(
    protected destroy$: DestroyService,
    protected layer: OLLayerVectorComponent,
    protected map: OLMapComponent
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
        if (this.#touched) {
          const geojson = JSON.parse(this.#format.writeFeature(this.feature));
          this.saveRedraw(cleanCoords(geojson)).subscribe(() =>
            this.#unsetFeature()
          );
        } else this.#unsetFeature();
      });
  }

  #unsetFeature(): void {
    if (this.#modifyStartKey) unByKey(this.#modifyStartKey);
    if (this.olModify) this.map.olMap.removeInteraction(this.olModify);
    if (this.olSnap) this.map.olMap.removeInteraction(this.olSnap);
    if (this.feature) this.feature.set('ol-interaction-redraw', false);
    this.#modifyStartKey = null;
    this.olModify = null;
    this.olSnap = null;
    this.feature = null;
    this.#touched = false;
  }

  ngOnDestroy(): void {
    this.#unsetFeature();
  }

  ngOnInit(): void {
    this.#handleStreams$();
  }

  resetRedraw(): void {
    this.feature.setGeometry(this.geometry);
  }

  // 👉 setFeature is called by the contextmenu code to initiate
  //    this interaction

  setFeature(feature: OLFeature<OLLineString | OLPolygon>): void {
    this.feature = feature;
    // 🔥 pretty hack back door -- see ol-style-parcels.ts
    this.feature.set('ol-interaction-redraw', true);
    // 👇 copy the geometry so we can restore it if redraw cancelled
    this.geometry = copy(feature.getGeometry());
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

  abstract saveRedraw(feature: GeoJSON.Feature<any>): Observable<boolean>;
}
