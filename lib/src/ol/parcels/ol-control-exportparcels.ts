import { DestroyService } from '../../services/destroy';
import { OLMapComponent } from '../ol-map';
import { OLSourceParcelsComponent } from '../ol-source-parcels';

import { simplify } from '../../common';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';

import { inject } from '@angular/core';
import { input } from '@angular/core';
import { saveAs } from 'file-saver';

import bbox from '@turf/bbox';
import OLFeature from 'ol/Feature';
import OLGeoJSON from 'ol/format/GeoJSON';
import OLProjection from 'ol/proj/Projection';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DestroyService],
  selector: 'app-ol-control-exportparcels',
  template: `
    <button (click)="export()" mat-icon-button>
      <fa-icon [icon]="['fas', 'download']" size="2x"></fa-icon>
    </button>
  `,
  styles: [
    `
      :host {
        display: block;
        pointer-events: auto;
      }
    `
  ]
})
export class OLControlExportParcelsComponent {
  fileName = input<string>();

  #format: OLGeoJSON;
  #map = inject(OLMapComponent);
  #source: OLSourceParcelsComponent;

  constructor() {
    this.#format = new OLGeoJSON({
      dataProjection: this.#map.featureProjection,
      featureProjection: this.#map.projection
    });
    this.#source = new OLSourceParcelsComponent();
    this.#source.ngOnInit();
  }

  export(): void {
    this.#source.export(
      this.#map.boundaryExtent,
      this.#map.olView.getResolution(),
      new OLProjection({ code: this.#map.projection }),
      this.#export.bind(this)
    );
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
    saveAs(blob, `${this.fileName()}.geojson`);
  }
}
