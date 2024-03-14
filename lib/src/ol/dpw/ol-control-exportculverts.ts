import { CulvertProperties } from '../../common';
import { LandmarksState } from '../../state/landmarks';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';

import { inject } from '@angular/core';
import { saveAs } from 'file-saver';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-control-exportculverts',
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
export class OLControlExportCulvertsComponent {
  @Input() fileName: string;

  #landmarksState = inject(LandmarksState);

  export(): void {
    const geojson = this.#landmarksState.toGeoJSON();
    // 👇 convert to GeoJSON to GPX waypoints
    const wpts = geojson.features.reduce((acc, feature) => {
      const coords = feature.geometry.coordinates;
      const props = <CulvertProperties>feature.properties.metadata;
      if (props.type === 'culvert') {
        // 👇 the opening is special
        const opening = props.diameter || `${props.width}x${props.height}`;
        // 👇 the rest of the culvert properties
        acc += `
        <wpt lat="${coords[1]}" lon="${coords[0]}">
          <name><![CDATA[${opening}" ${props.length}' ${props.condition} ${
            props.count
          }x ${props.floodHazard} ${props.headwall} ${props.material} ${
            props.year ?? ''
          }]]></name>
          <ele>${coords[2] ?? 0}</ele>
          <desc><![CDATA[${props.description}]]></desc>
          <keywords><![CDATA[${props.location}]]></keywords>
        </wpt>
      `;
      }
      return acc;
    }, '');
    // 👇 complete the GPX XML
    const gpx = `
    <gpx
      xmlns="http://www.topografix.com/GPX/1/1"
      version="1.1"
      xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
      xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd"
    >
    ${wpts}
    </gpx>
    `;
    // 👇 emit the data
    const blob = new Blob([gpx], {
      type: 'text/plain;charset=utf-8'
    });
    saveAs(blob, `${this.fileName}.gpx`);
  }
}
