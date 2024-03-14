import { DestroyService } from '../services/destroy';
import { OLMapComponent } from './ol-map';

import { EventsKey as OLEventsKey } from 'ol/events';
import { Observable } from 'rxjs';

import { inject } from '@angular/core';
import { takeUntil } from 'rxjs/operators';
import { unByKey } from 'ol/Observable';

import cleanCoords from '@turf/clean-coords';
import OLDraw from 'ol/interaction/Draw';
import OLGeoJSON from 'ol/format/GeoJSON';
import OLVectorLayer from 'ol/layer/Vector';
import OLVectorSource from 'ol/source/Vector';
import simplify from '@turf/simplify';

export abstract class OLInteractionAbstractDrawComponent {
  olDraw: OLDraw;

  #destroy$ = inject(DestroyService);
  #drawStartKey: OLEventsKey;
  #format: OLGeoJSON;
  #layer: OLVectorLayer<any>;
  #map = inject(OLMapComponent);
  #source: OLVectorSource<any>;
  #touched = false;

  constructor() {
    this.#format = new OLGeoJSON({
      dataProjection: this.#map.featureProjection,
      featureProjection: this.#map.projection
    });
  }

  onDestroy(): void {
    this.#stopDraw();
  }

  onInit(): void {
    this.#handleStreams$();
  }

  resetDraw(): void {
    this.olDraw.abortDrawing();
  }

  // 👉 setFeature is called by the contextmenu code to initiate
  //    this interaction

  startDraw(geometryType: any): void {
    // 👇 layer into which new feature is drawn
    this.#source = new OLVectorSource();
    this.#layer = new OLVectorLayer({ source: this.#source });
    this.#map.olMap.addLayer(this.#layer);
    // 👇 create a standard OL Draw interaction
    this.olDraw = new OLDraw({
      freehand: true,
      source: this.#source,
      stopClick: true,
      type: geometryType
    });
    this.#drawStartKey = this.olDraw.on(
      'drawstart',
      () => (this.#touched = true)
    );
    this.#map.olMap.addInteraction(this.olDraw);
  }

  // 👇 the idea is that ESC accepts the draw

  #handleStreams$(): void {
    this.#map.escape$.pipe(takeUntil(this.#destroy$)).subscribe(() => {
      if (this.#touched) {
        const geojsons = this.#source.getFeatures().map((feature) => {
          const geojson = JSON.parse(this.#format.writeFeature(feature));
          return simplify(cleanCoords(geojson), {
            tolerance: 0.00001,
            highQuality: false
          });
        });
        this.saveFeatures(geojsons).subscribe(() => this.#stopDraw());
      } else this.#stopDraw();
    });
  }

  #stopDraw(): void {
    if (this.#drawStartKey) unByKey(this.#drawStartKey);
    if (this.#layer) this.#map.olMap.removeLayer(this.#layer);
    if (this.olDraw) this.#map.olMap.removeInteraction(this.olDraw);
    this.#drawStartKey = null;
    this.#layer = null;
    this.olDraw = null;
    this.#touched = false;
  }

  abstract saveFeatures(features: GeoJSON.Feature<any>[]): Observable<boolean>;
}
