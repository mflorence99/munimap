import { LandmarksState } from '../../state/landmarks';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';

import { saveAs } from 'file-saver';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-control-exportlandmarks',
  template: `
    <button (click)="export()" mat-icon-button>
      <fa-icon [icon]="['fas', 'download']" size="2x"></fa-icon>
    </button>
  `
})
export class OLControlExportLandmarksComponent {
  @Input() fileName: string;

  constructor(private landmarksState: LandmarksState) {}

  export(): void {
    const geojson = this.landmarksState.toGeoJSON();
    const blob = new Blob([JSON.stringify(geojson)], {
      type: 'text/plain;charset=utf-8'
    });
    saveAs(blob, `${this.fileName}.geojson`);
  }
}
