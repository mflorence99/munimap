import { DestroyService } from '../services/destroy';
import { Mapable } from './ol-mapable';
import { MapableComponent } from './ol-mapable';
import { OLLayerVectorComponent } from './ol-layer-vector';
import { OLMapComponent } from './ol-map';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { OnInit } from '@angular/core';

import { click } from 'ol/events/condition';
import { forwardRef } from '@angular/core';
import { platformModifierKeyOnly } from 'ol/events/condition';
import { takeUntil } from 'rxjs/operators';

import OLGeoJSON from 'ol/format/GeoJSON';
import OLModify from 'ol/interaction/Modify';

// 🔥 this is a back-door interface only for me to hack in revised
//    town boundaries -- the state supplied geometries do not properly
//    align with those of the edge parcels and we want to clean them up

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: MapableComponent,
      useExisting: forwardRef(() => OLInteractionRedrawBoundaryComponent)
    },
    DestroyService
  ],
  selector: 'app-ol-interaction-redrawboundary',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLInteractionRedrawBoundaryComponent implements Mapable, OnInit {
  #format: OLGeoJSON;

  olModify: OLModify;

  constructor(
    private destroy$: DestroyService,
    private layer: OLLayerVectorComponent,
    private map: OLMapComponent
  ) {
    // 👉 one to rule them all
    this.#format = new OLGeoJSON({
      dataProjection: this.map.featureProjection,
      featureProjection: this.map.projection
    });
  }

  #emitBoundary(): void {
    const geojson: GeoJSON.FeatureCollection = {
      features: [
        JSON.parse(
          this.#format.writeFeatures(
            this.layer.olLayer.getSource().getFeatures()
          )
        )
      ],
      type: 'FeatureCollection'
    };
    // 👉 jam original bbox, which was calculated as 4:3
    geojson.features[0].bbox = this.map.boundary.features[0].bbox;
    // 👉 put the adjusted boundary on the clipboard
    navigator.clipboard.writeText(JSON.stringify(geojson, null, ' '));
    // 👉 jst so we know something happened
    console.log(geojson);
  }

  // 👇 the idea is that ESC accepts the redraw

  #handleStreams$(): void {
    this.map.escape$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.#emitBoundary();
    });
  }

  addToMap(): void {
    this.olModify = new OLModify({
      deleteCondition: (event): boolean =>
        click(event) && platformModifierKeyOnly(event),
      hitDetection: this.layer.olLayer,
      source: this.layer.olLayer.getSource()
    });
    this.map.olMap.addInteraction(this.olModify);
  }

  ngOnInit(): void {
    this.#handleStreams$();
  }
}