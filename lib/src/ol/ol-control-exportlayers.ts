import { OLMapComponent } from './ol-map';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';

import { inject } from '@angular/core';
import { input } from '@angular/core';
import { saveAs } from 'file-saver';

import OLGeoJSON from 'ol/format/GeoJSON';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-control-exportlayers',
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
export class OLControlExportLayersComponent {
  fileName = input<string>();
  layerIDs = input<string[]>();

  #format: OLGeoJSON;
  #map = inject(OLMapComponent);

  constructor() {
    // 👉 one to rule them all
    this.#format = new OLGeoJSON({
      dataProjection: this.#map.featureProjection,
      featureProjection: this.#map.projection
    });
  }

  export(): void {
    const layers: any[] = this.#map.olMap
      .getLayers()
      .getArray()
      .filter((layer) => this.layerIDs().includes(layer.get('id')));
    const features = layers.flatMap((layer) => layer.getSource().getFeatures());
    const geojson = JSON.parse(this.#format.writeFeatures(features));
    const blob = new Blob([JSON.stringify(geojson)], {
      type: 'text/plain;charset=utf-8'
    });
    saveAs(blob, `${this.fileName()}.geojson`);
  }
}
