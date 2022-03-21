import { Features } from '../geojson';
import { GeoJSONService } from '../services/geojson';
import { OLLayerVectorComponent } from './ol-layer-vector';
import { OLMapComponent } from './ol-map';

import { ActivatedRoute } from '@angular/router';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Coordinate } from 'ol/coordinate';
import { Input } from '@angular/core';
import { Optional } from '@angular/core';

import { bbox as bboxStrategy } from 'ol/loadingstrategy';
import { map } from 'rxjs/operators';
import { transformExtent } from 'ol/proj';

import copy from 'fast-copy';
import GeoJSON from 'ol/format/GeoJSON';
import OLFeature from 'ol/Feature';
import OLProjection from 'ol/proj/Projection';
import OLVector from 'ol/source/Vector';

const attribution =
  'Powered by <a href="https://www.granit.unh.edu/data/downloadfreedata/alphabetical/databyalpha.html" target="_blank">NH GRANIT</a>';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-source-geojson',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLSourceGeoJSONComponent {
  @Input() exclude: string[];

  @Input() layerKey: string;

  olVector: OLVector<any>;

  @Input() path: string;

  constructor(
    private geoJSON: GeoJSONService,
    @Optional() private layer: OLLayerVectorComponent,
    private map: OLMapComponent,
    private route: ActivatedRoute
  ) {
    this.olVector = new OLVector({
      attributions: [attribution],
      format: new GeoJSON(),
      loader: this.#loader.bind(this),
      strategy: bboxStrategy
    });
    this.layer?.olLayer.setSource(this.olVector);
  }

  #loader(
    extent: Coordinate,
    resolution: number,
    projection: OLProjection,
    success: Function
  ): void {
    const bbox = transformExtent(
      extent,
      projection,
      this.map.featureProjection
    );
    this.geoJSON
      .loadByIndex(this.route, this.path ?? this.map.path, this.layerKey, bbox)
      .pipe(
        map((geojson: Features) => {
          if (this.exclude) {
            const filtered = copy(geojson);
            // 🔥 this is a hack implementation but is easily expanded
            //    if necessary to support include and/or filtering
            //    on a field other than "type"
            filtered.features = geojson.features.filter(
              (feature: any) => !this.exclude.includes(feature.properties.type)
            );
            return filtered;
          } else return geojson;
        })
      )
      .subscribe((geojson: Features) => {
        // 👉 convert features into OL format
        const features = this.olVector.getFormat().readFeatures(geojson, {
          featureProjection: this.map.projection
        }) as OLFeature<any>[];
        // 👉 add each feature not already present
        features.forEach((feature) => {
          if (!this.olVector.hasFeature(feature))
            this.olVector.addFeature(feature);
        });
        success(features);
      });
  }
}
