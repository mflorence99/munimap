import { OLLayerVectorComponent } from './ol-layer-vector';
import { OLMapComponent } from './ol-map';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';

import GeoJSON from 'ol/format/GeoJSON';
import OLVector from 'ol/source/Vector';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-source-boundarygrid',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLSourceBoundaryGridComponent {
  olVector: OLVector<any>;

  constructor(
    private layer: OLLayerVectorComponent,
    private map: OLMapComponent
  ) {
    this.olVector = new OLVector();
    this.olVector.addFeatures(
      new GeoJSON().readFeatures(this.map.boundaryGrid, {
        featureProjection: this.map.projection
      })
    );
    this.layer.olLayer.setSource(this.olVector);
  }
}
