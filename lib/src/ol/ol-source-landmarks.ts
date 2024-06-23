import { DestroyService } from '../services/destroy';
import { Landmark } from '../common';
import { LandmarksState } from '../state/landmarks';
import { OLInteractionSelectLandmarksComponent } from './ol-interaction-selectlandmarks';
import { OLLayerVectorComponent } from './ol-layer-vector';
import { OLMapComponent } from './ol-map';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Coordinate } from 'ol/coordinate';
import { Observable } from 'rxjs';
import { OnInit } from '@angular/core';
import { Select } from '@ngxs/store';

import { all as allStrategy } from 'ol/loadingstrategy';
import { bbox } from '@turf/bbox';
import { combineLatest } from 'rxjs';
import { featureCollection } from '@turf/helpers';
import { inject } from '@angular/core';
import { input } from '@angular/core';
import { takeUntil } from 'rxjs/operators';
import { toObservable } from '@angular/core/rxjs-interop';
import { transformExtent } from 'ol/proj';

import GeoJSON from 'ol/format/GeoJSON';
import OLFeature from 'ol/Feature';
import OLProjection from 'ol/proj/Projection';
import OLVector from 'ol/source/Vector';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DestroyService],
  selector: 'app-ol-source-landmarks',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLSourceLandmarksComponent implements OnInit {
  @Select(LandmarksState) landmarks$: Observable<Landmark[]>;

  filterFn = input<(value) => (landmark) => boolean>();
  filterValue = input<any>();
  filterValue$: Observable<string> = toObservable(this.filterValue);
  maxZoom = input(18);
  olVector: OLVector<any>;
  zoomAnimationDuration = input(200);

  #destroy$ = inject(DestroyService);
  #layer = inject(OLLayerVectorComponent);
  #map = inject(OLMapComponent);
  #success: Function;

  constructor() {
    this.olVector = new OLVector({
      format: new GeoJSON(),
      loader: this.#loader.bind(this),
      strategy: allStrategy
    });
    this.olVector.setProperties({ component: this }, true);
    this.#layer.olLayer.setSource(this.olVector);
  }

  ngOnInit(): void {
    this.#handleStreams$();
  }

  #handleStreams$(): void {
    combineLatest([this.landmarks$, this.filterValue$])
      .pipe(takeUntil(this.#destroy$))
      .subscribe(([landmarks, filterValue]) => {
        // 👉 represent landmarks as geojson
        const filteredLandmarks = this.filterFn()
          ? landmarks.filter(this.filterFn()(filterValue))
          : landmarks;
        const isFiltered = landmarks.length !== filteredLandmarks.length;
        const geojson = featureCollection(filteredLandmarks);
        // 👉 convert features into OL format
        const features = this.olVector.getFormat().readFeatures(geojson, {
          featureProjection: this.#map.projection
        }) as OLFeature<any>[];
        // 👉 add feature to source
        this.olVector.clear();
        this.olVector.addFeatures(features);
        // 👉 the selector MAY not be present and may not be for landmarks
        const selector =
          this.#map.selector() as OLInteractionSelectLandmarksComponent;
        // 👉 reselect selected features b/c we've potentially removed them
        const selectedIDs = selector?.selectedIDs;
        if (selectedIDs?.length > 0) selector?.reselectLandmarks?.(selectedIDs);
        // 👇 zoom to the extent of all the filtered landmarks
        if (isFiltered) {
          const extent = transformExtent(
            bbox(geojson),
            this.#map.featureProjection,
            this.#map.projection
          );
          const minZoom = this.#map.olView.getMinZoom();
          this.#map.olView.setMinZoom(this.#map.minUsefulZoom());
          this.#map.olView.fit(extent, {
            callback: () => {
              this.#map.olView.setMinZoom(minZoom);
            },
            duration: this.zoomAnimationDuration(),
            maxZoom: this.maxZoom() ?? this.#map.maxZoom(),
            size: this.#map.olMap.getSize()
          });
        }
        this.#success?.(features);
      });
  }

  #loader(
    extent: Coordinate,
    resolution: number,
    projection: OLProjection,
    success: Function
  ): void {
    this.#success = success;
  }
}
