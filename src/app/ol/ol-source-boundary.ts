import { OLAttributionComponent } from './ol-attribution';
import { OLLayerVectorComponent } from './ol-layer-vector';
import { OLMapComponent } from './ol-map';

import { AfterContentInit } from '@angular/core';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { ContentChildren } from '@angular/core';
import { QueryList } from '@angular/core';

import GeoJSON from 'ol/format/GeoJSON';
import OLVector from 'ol/source/Vector';

const attribution =
  'Powered by <a href="https://www.granit.unh.edu/data/downloadfreedata/alphabetical/databyalpha.html" target="_blank">NH GRANIT</a>';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-source-boundary',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLSourceBoundaryComponent implements AfterContentInit {
  @ContentChildren(OLAttributionComponent)
  attributions: QueryList<OLAttributionComponent>;

  olVector: OLVector<any>;

  constructor(
    private layer: OLLayerVectorComponent,
    private map: OLMapComponent
  ) {
    this.olVector = new OLVector({ attributions: [attribution] });
  }

  ngAfterContentInit(): void {
    this.olVector.addFeatures(
      new GeoJSON().readFeatures(this.map.boundary, {
        featureProjection: this.map.projection
      })
    );
    // 👉 note that we're saying we don't expect
    //    the list of attributions to change
    this.olVector.setAttributions(
      this.attributions.map((attribution) => attribution.getAttribution())
    );
    this.layer.olLayer.setSource(this.olVector);
  }
}
