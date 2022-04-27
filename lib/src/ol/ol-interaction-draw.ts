import { DestroyService } from '../services/destroy';
import { OLLayerVectorComponent } from './ol-layer-vector';
import { OLMapComponent } from './ol-map';

import { Component } from '@angular/core';
import { EventsKey as OLEventsKey } from 'ol/events';
import { OnDestroy } from '@angular/core';
import { OnInit } from '@angular/core';

import { merge } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { unByKey } from 'ol/Observable';

import OLDraw from 'ol/interaction/Draw';
import OLGeoJSON from 'ol/format/GeoJSON';
import OLSnap from 'ol/interaction/Snap';
import OLVectorLayer from 'ol/layer/Vector';
import OLVectorSource from 'ol/source/Vector';

@Component({ template: '' })
export abstract class OLInteractionDrawComponent implements OnDestroy, OnInit {
  #drawStartKey: OLEventsKey;
  #format: OLGeoJSON;
  #layer: OLVectorLayer<any>;
  #source: OLVectorSource<any>;
  #touched = false;

  olDraw: OLDraw;
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

  // 👇 the idea is that ESC accepts the draw

  #handleStreams$(): void {
    merge(this.map.escape$, this.map.featuresSelected)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.#touched) {
          const features = this.#source
            .getFeatures()
            .map((feature) => JSON.parse(this.#format.writeFeature(feature)));
          this.saveFeatures(features);
        }
        this.#stopDraw();
      });
  }

  #stopDraw(): void {
    if (this.#drawStartKey) unByKey(this.#drawStartKey);
    if (this.#layer) this.map.olMap.removeLayer(this.#layer);
    if (this.olDraw) this.map.olMap.removeInteraction(this.olDraw);
    if (this.olSnap) this.map.olMap.removeInteraction(this.olSnap);
    this.#touched = false;
  }

  ngOnDestroy(): void {
    this.#stopDraw();
  }

  ngOnInit(): void {
    this.#handleStreams$();
  }

  // 👉 setFeature is called by the contextmenu code to initiate
  //    this interaction

  startDraw(): void {
    // 👇 layer into which new feature is drawn
    this.#source = new OLVectorSource();
    this.#layer = new OLVectorLayer({ source: this.#source });
    this.map.olMap.addLayer(this.#layer);
    // 👇 create a standard OL Draw interaction
    this.olDraw = new OLDraw({
      stopClick: true,
      source: this.#source,
      type: 'Polygon'
    });
    this.#drawStartKey = this.olDraw.on(
      'drawstart',
      () => (this.#touched = true)
    );
    this.map.olMap.addInteraction(this.olDraw);
    // 👇 create a standard OL Snap interaction
    this.olSnap = new OLSnap({ source: this.layer.olLayer.getSource() });
    this.map.olMap.addInteraction(this.olSnap);
  }

  abstract saveFeatures(features: GeoJSON.Feature<any>[]): void;
}
