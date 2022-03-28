import { OLLayerTileComponent } from './ol-layer-tile';
import { OLMapComponent } from './ol-map';

import { environment } from '../environment';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';

import OLImageTile from 'ol/ImageTile';
import OLTileWMS from 'ol/source/TileWMS';

const attribution =
  '<a href="carto.nationalmap.gov/" target="_blank">National Map</a>';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-source-contours',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLSourceContoursComponent {
  // 👇 https://carto.nationalmap.gov/arcgis/rest/services/contours/MapServer
  @Input() layers = [
    1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 12, 13, 15, 16, 17, 18, 21, 22, 25, 26
  ];

  olTileWMS: OLTileWMS;

  url =
    'https://carto.nationalmap.gov/arcgis/rest/services/contours/MapServer/export?bbox=XXXXXX&bboxSR=102100&imageSR=102100&size=256,256&dpi=96&format=png32&transparent=true&layers=show:YYYYYY&f=image';

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
    const url = `${
      environment.endpoints.proxy
    }/proxy/contours?url=${encodeURIComponent(
      this.url.replace('XXXXXX', bbox).replace('YYYYYY', this.layers.join(','))
    )}`;
    img.src = url;
  }
}
