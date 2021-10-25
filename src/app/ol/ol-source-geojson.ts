import { GeoJSONService } from '../services/geojson';
import { OLLayerVectorComponent } from './ol-layer-vector';
import { OLMapComponent } from './ol-map';

import { ActivatedRoute } from '@angular/router';
import { AfterContentInit } from '@angular/core';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';

import GeoJSON from 'ol/format/GeoJSON';
import OLVector from 'ol/source/Vector';

const attribution =
  'Powered by <a href="https://www.granit.unh.edu/data/downloadfreedata/alphabetical/databyalpha.html" target="_blank">NH GRANIT</a>';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-source-geojson',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLSourceGeoJSONComponent implements AfterContentInit {
  @Input() layerKey: string;

  olVector: OLVector<any>;

  @Input() path: string;

  constructor(
    private geoJSON: GeoJSONService,
    private layer: OLLayerVectorComponent,
    private map: OLMapComponent,
    private route: ActivatedRoute
  ) {
    this.olVector = new OLVector({ features: null });
  }

  ngAfterContentInit(): void {
    this.geoJSON
      .loadByIndex(this.route, this.path ?? this.map.path, this.layerKey)
      .subscribe((geojson: GeoJSON.FeatureCollection<GeoJSON.Polygon>) => {
        this.olVector.addFeatures(
          new GeoJSON().readFeatures(geojson, {
            featureProjection: this.map.projection
          })
        );
        this.olVector.setAttributions([attribution]);
        this.layer.olLayer.setSource(this.olVector);
      });
  }
}
