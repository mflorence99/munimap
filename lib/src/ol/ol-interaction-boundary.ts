import { AuthState } from '../state/auth';
import { DestroyService } from '../services/destroy';
import { Features } from '../geojson';
import { OLLayerVectorComponent } from './ol-layer-vector';
import { OLMapComponent } from './ol-map';

import { simplify } from '../geojson';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { OnDestroy } from '@angular/core';
import { OnInit } from '@angular/core';

import { click } from 'ol/events/condition';
import { merge } from 'rxjs';
import { platformModifierKeyOnly } from 'ol/events/condition';
import { takeUntil } from 'rxjs/operators';
import { transformExtent } from 'ol/proj';

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
    const geojson: Features = {
      features: [JSON.parse(this.#format.writeFeature(this.#boundary))],
      type: 'FeatureCollection'
    };
    // 👉 reverse projection of original bbox
    geojson.features[0].bbox = transformExtent(
      this.map.boundaryExtent,
      this.map.projection,
      this.map.featureProjection
    ) as any;
    // 👉 put the adjusted boundary on the clipboard
    navigator.clipboard.writeText(JSON.stringify(simplify(geojson), null, ' '));
    console.log('%cAdjusted boundary copied to clipboard', 'color: skyblue');
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

  // 👇 this makes the interaction work only for me

  ngOnInit(): void {
    if (this.authState.currentProfile().email === 'mflo999@gmail.com') {
      // 🔥 horrible hack but OK as this is just a backdoor
      setTimeout(() => {
        this.#handleStreams$();
        this.#setBoundary();
      }, 1000);
    }
  }
}