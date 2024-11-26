import { OLLayerTileComponent } from './ol-layer-tile';

import { environment } from '../environment';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';

import { inject } from '@angular/core';
import { input } from '@angular/core';

import OLImageTile from 'ol/ImageTile';
import OLTileWMS from 'ol/source/TileWMS';

// 🔥 this appears to be throwing 502 errors in prod 12/13/2023

const attribution = '<a href="https://www.usgs.gov/" target="_blank">USGS</a>';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-source-hillshade',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }'],
  standalone: false
})
export class OLSourceHillshadeComponent {
  colorize = input(false);
  olTileWMS: OLTileWMS;

  // 👇 we have to disambiguate by version because the service can
  //    sometimes be unreliable and cache bad images

  url =
    'https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer/exportImage?f=image&format=jpgpng&renderingRule=YYYYYY&bbox=XXXXXX&imageSR=102100&bboxSR=102100&size=256,256&version=VVVVVV';

  #layer = inject(OLLayerTileComponent);

  constructor() {
    this.olTileWMS = new OLTileWMS({
      attributions: [attribution],
      crossOrigin: 'anonymous',
      params: { LAYERS: 'dummy' },
      tileLoadFunction: this.#loader.bind(this),
      url: 'http://dummy.com'
    });
    this.olTileWMS.setProperties({ component: this }, true);
    this.#layer.olLayer.setSource(this.olTileWMS);
  }

  #loader(tile: OLImageTile, src: string): void {
    const img = tile.getImage() as HTMLImageElement;
    const parsed = new URL(src);
    const bbox = parsed.searchParams.get('BBOX');
    const renderingRule = this.colorize()
      ? { rasterFunction: 'Hillshade Elevation Tinted' }
      : { rasterFunction: 'Hillshade Gray' };
    const url = `${
      environment.endpoints.proxy
    }/proxy/hillshade?url=${encodeURIComponent(
      this.url
        .replace('VVVVVV', environment.package.version)
        .replace('XXXXXX', bbox)
        .replace('YYYYYY', JSON.stringify(renderingRule))
    )}`;
    img.src = url;
  }
}
