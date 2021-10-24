import { Mapable } from './ol-mapable';
import { MapableComponent } from './ol-mapable';
import { OLMapComponent } from './ol-map';
import { OLSourceGeoJSONComponent } from './ol-source-geojson';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';

import { forwardRef } from '@angular/core';

import OLSearch from 'ol-ext/control/SearchFeature';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: MapableComponent,
      useExisting: forwardRef(() => OLControlSearchComponent)
    }
  ],
  selector: 'app-ol-control-search',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLControlSearchComponent implements Mapable {
  olControl: OLSearch;

  constructor(
    private map: OLMapComponent,
    private source: OLSourceGeoJSONComponent
  ) {
    this.olControl = new OLSearch({
      source: this.source
    });
  }

  addToMap(): void {
    this.map.olMap.addControl(this.olControl);
  }
}
