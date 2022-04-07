import { DestroyService } from '../services/destroy';
import { Landmark } from '../common';
import { LandmarksState } from '../state/landmarks';
import { OLLayerVectorComponent } from './ol-layer-vector';
import { OLMapComponent } from './ol-map';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Coordinate } from 'ol/coordinate';
import { Observable } from 'rxjs';
import { OnInit } from '@angular/core';
import { Select } from '@ngxs/store';

import { all as allStrategy } from 'ol/loadingstrategy';
import { takeUntil } from 'rxjs/operators';

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
  #success: Function;

  @Select(LandmarksState) landmarks$: Observable<Landmark[]>;

  olVector: OLVector<any>;

  constructor(
    private destroy$: DestroyService,
    private layer: OLLayerVectorComponent,
    private map: OLMapComponent,
    private landmarksState: LandmarksState
  ) {
    this.olVector = new OLVector({
      format: new GeoJSON(),
      loader: this.#loader.bind(this),
      strategy: allStrategy
    });
    this.layer.olLayer.setSource(this.olVector);
  }

  #handleStreams$(): void {
    this.landmarks$.pipe(takeUntil(this.destroy$)).subscribe((landmarks) => {
      // 👉 represent landmarks as geojson
      const geojson = {
        features: landmarks,
        type: 'FeatureCollection'
      };
      // 👉 convert features into OL format
      const features = this.olVector.getFormat().readFeatures(geojson, {
        featureProjection: this.map.projection
      }) as OLFeature<any>[];
      // 👉 add feature to source
      this.olVector.clear();
      this.olVector.addFeatures(features);
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

  ngOnInit(): void {
    this.#handleStreams$();
  }
}
