import { OLLayerImageComponent } from './ol-layer-image';
import { OLLayerMapboxComponent } from './ol-layer-mapbox';
import { OLLayerTileComponent } from './ol-layer-tile';
import { OLLayerVectorComponent } from './ol-layer-vector';
import { OLLayerVectorTileComponent } from './ol-layer-vectortile';
import { OLMapComponent } from './ol-map';

import { AfterContentInit } from '@angular/core';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Optional } from '@angular/core';

import copy from 'fast-copy';
import Crop from 'ol-ext/filter/Crop';
import Feature from 'ol/Feature';
import Polygon from 'ol/geom/Polygon';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-filter-crop2boundary',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLFilterCrop2BoundaryComponent implements AfterContentInit {
  #layer: any;

  olFilter: typeof Crop;

  constructor(
    @Optional() layer1: OLLayerImageComponent,
    @Optional() layer2: OLLayerMapboxComponent,
    @Optional() layer3: OLLayerTileComponent,
    @Optional() layer4: OLLayerVectorComponent,
    @Optional() layer5: OLLayerVectorTileComponent,
    private map: OLMapComponent
  ) {
    // 👇 choose which layer parent
    this.#layer = layer1 ?? layer2 ?? layer3 ?? layer4 ?? layer5;
    // 👇 build the filter
    const coords: any = copy(
      this.map.boundary.features[0].geometry.coordinates
    );
    const feature = new Feature(new Polygon(coords));
    feature
      .getGeometry()
      .transform(this.map.featureProjection, this.map.projection);
    this.olFilter = new Crop({
      active: true,
      feature: feature,
      inner: false
    });
  }

  ngAfterContentInit(): void {
    // 👇 ol-ext has monkey-patched addFilter
    this.#layer.olLayer['addFilter'](this.olFilter);
  }
}
