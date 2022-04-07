import { DestroyService } from '../../services/destroy';
import { GeoJSONService } from '../../services/geojson';
import { OLLayerVectorComponent } from '../ol-layer-vector';
import { OLMapComponent } from '../ol-map';
import { OLSourceParcelsComponent } from '../ol-source-parcels';
import { ParcelsState } from '../../state/parcels';

import { simplify } from '../../common';

import { ActivatedRoute } from '@angular/router';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';

import { saveAs } from 'file-saver';

import bbox from '@turf/bbox';
import OLFeature from 'ol/Feature';
import OLGeoJSON from 'ol/format/GeoJSON';
import OLProjection from 'ol/proj/Projection';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DestroyService],
  selector: 'app-ol-control-exportparcels',
  templateUrl: './ol-control-exportparcels.html',
  styleUrls: ['./ol-control-exportparcels.scss']
})
export class OLControlExportParcelsComponent {
  #format: OLGeoJSON;
  #layer: OLLayerVectorComponent;
  #source: OLSourceParcelsComponent;

  @Input() fileName: string;

  constructor(
    private destroy$: DestroyService,
    private geoJSON: GeoJSONService,
    private map: OLMapComponent,
    private parcelsState: ParcelsState,
    private route: ActivatedRoute
  ) {
    this.#format = new OLGeoJSON({
      dataProjection: this.map.featureProjection,
      featureProjection: this.map.projection
    });
    this.#layer = new OLLayerVectorComponent(map);
    this.#source = new OLSourceParcelsComponent(
      this.destroy$,
      this.geoJSON,
      this.#layer,
      this.map,
      this.parcelsState,
      this.route
    );
    this.#source.ngOnInit();
  }

  #export(features: OLFeature<any>[]): void {
    const geojson = JSON.parse(this.#format.writeFeatures(features));
    geojson.features = geojson.features.map((feature) => {
      feature.bbox = bbox(feature);
      return feature;
    });
    const blob = new Blob([JSON.stringify(simplify(geojson))], {
      type: 'text/plain;charset=utf-8'
    });
    saveAs(blob, `${this.fileName}.geojson`);
  }

  export(): void {
    this.#source.export(
      this.map.boundaryExtent,
      this.map.olView.getResolution(),
      new OLProjection({ code: this.map.projection }),
      this.#export.bind(this)
    );
  }
}
