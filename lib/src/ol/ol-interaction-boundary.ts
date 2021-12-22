import { AuthState } from '../state/auth';
import { DestroyService } from '../services/destroy';
import { OLLayerVectorComponent } from './ol-layer-vector';
import { OLMapComponent } from './ol-map';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { OnDestroy } from '@angular/core';
import { OnInit } from '@angular/core';

import { click } from 'ol/events/condition';
import { merge } from 'rxjs';
import { platformModifierKeyOnly } from 'ol/events/condition';
import { takeUntil } from 'rxjs/operators';

import OLCollection from 'ol/Collection';
import OLFeature from 'ol/Feature';
import OLGeoJSON from 'ol/format/GeoJSON';
import OLModify from 'ol/interaction/Modify';
import OLMultiPolygon from 'ol/geom/MultiPolygon';
import OLPolygon from 'ol/geom/Polygon';

// 🔥 this is a back-door interface onky for me to hack in revised
//    town boundaries -- the state supplied geometries do not properly
//    align with those of the edge parcels and we want to clean them up

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-interaction-boundary',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLInteractionBoundaryComponent implements OnDestroy, OnInit {
  #boundary: OLFeature<OLPolygon | OLMultiPolygon>;
  #format: OLGeoJSON;

  olModify: OLModify;

  constructor(
    private authState: AuthState,
    private destroy$: DestroyService,
    private layer: OLLayerVectorComponent,
    private map: OLMapComponent
  ) {
    this.#format = new OLGeoJSON({
      dataProjection: this.map.featureProjection,
      featureProjection: this.map.projection
    });
  }

  #emitBoundary(): void {
    const geojson = JSON.parse(this.#format.writeFeature(this.#boundary));
    console.log(JSON.stringify(geojson, null, '  '));
  }

  // 👇 the idea is that a selection change or ESC accepts the redraw

  #handleStreams$(): void {
    merge(this.map.escape$, this.map.selector?.featuresSelected)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.#emitBoundary();
      });
  }

  #setBoundary(): void {
    // 👉 the one and only feature is the boundary
    this.#boundary = this.layer.olLayer.getSource().getFeatures()[0];
    const features = new OLCollection([this.#boundary]);
    this.olModify = new OLModify({
      deleteCondition: (event): boolean =>
        click(event) && platformModifierKeyOnly(event),
      features,
      hitDetection: this.layer.olLayer
    });
    this.map.olMap.addInteraction(this.olModify);
  }

  #unsetBoundary(): void {
    if (this.olModify) this.map.olMap.removeInteraction(this.olModify);
  }

  ngOnDestroy(): void {
    this.#unsetBoundary();
  }

  ngOnInit(): void {
    this.#handleStreams$();
    setTimeout(() => this.#setBoundary(), 1000);
  }
}
