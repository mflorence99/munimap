/* eslint-disable @typescript-eslint/naming-convention */

import { OLLayerTileComponent } from './ol-layer-tile';
import { OLMapComponent } from './ol-map';

import { environment } from '../environment';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';

import OLImageTile from 'ol/ImageTile';
import OLTileWMS from 'ol/source/TileWMS';

const attribution = '<a href="https://www.usgs.gov/" target="_blank">USGS</a>';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-source-contours',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLSourceContoursComponent {
  @Input() interval = 0 /* 👈 in meters */;

  olTileWMS: OLTileWMS;

  url =
    'https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer/exportImage?f=image&format=jpgpng&renderingRule=YYYYYY&bbox=XXXXXX&imageSR=102100&bboxSR=102100&size=256,256';

  constructor(
    private layer: OLLayerTileComponent,
    private map: OLMapComponent
  ) {
    this.olTileWMS = new OLTileWMS({
      attributions: [attribution],
      crossOrigin: 'anonymous',
      // eslint-disable-next-line @typescript-eslint/naming-convention
      params: { LAYERS: 'dummy' },
      tileLoadFunction: this.#loader.bind(this),
      url: 'http://dummy.com'
    });
    this.layer.olLayer.setSource(this.olTileWMS);
  }

  #loader(tile: OLImageTile, src: string): void {
    const img = tile.getImage() as HTMLImageElement;
    const parsed = new URL(src);
    const bbox = parsed.searchParams.get('BBOX');
    const renderingRule = {
      rasterFunction: 'Contour 25',
      rasterFunctionArguments: this.interval
        ? {
            ContourInterval: Math.floor(this.interval),
            ZBase: 1,
            NumberOfContours: 0
          }
        : {}
    };
    const url = `${
      environment.endpoints.proxy
    }/proxy/contours?url=${encodeURIComponent(
      this.url
        .replace('XXXXXX', bbox)
        .replace('YYYYYY', JSON.stringify(renderingRule))
    )}`;
    img.src = url;
  }
}
