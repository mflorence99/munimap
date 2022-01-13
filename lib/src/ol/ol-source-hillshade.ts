import { OLLayerTileComponent } from './ol-layer-tile';
import { OLMapComponent } from './ol-map';

import { environment } from '../environment';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';

import OLImageTile from 'ol/ImageTile';
import OLTileWMS from 'ol/source/TileWMS';

// ⚠️ this source isn't fully developed (no retry, for example)
//    b/c we decided not to use it -- there are artifacts were the
//    shading changes from tile to tile -- it worked out better
//    to enhance the arcgis hillshade source

const attribution =
  'Powered by <a href="https://granitview.unh.edu/html5viewer/index.html?viewer=granit_view" target="_blank">GRANIT<i>View</i></a>';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-source-hillshade',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLSourceHillshadeComponent {
  olTileWMS: OLTileWMS;
  url =
    'https://nhgeodata.unh.edu/nhgeodata/rest/services/EDP/Elevation_Rasters/MapServer/export?dpi=96&transparent=true&format=png8&layers=show:3&dynamicLayers=%5B%7B%22id%22%3A3%2C%22name%22%3A%22Hillshade%20Image%22%2C%22source%22%3A%7B%22type%22%3A%22mapLayer%22%2C%22mapLayerId%22%3A3%7D%2C%22minScale%22%3A0%2C%22maxScale%22%3A0%7D%5D&bbox=XXXXXX&bboxSR=102100&imageSR=102100&size=256,256&f=image';

  constructor(
    private layer: OLLayerTileComponent,
    private map: OLMapComponent
  ) {
    this.olTileWMS = new OLTileWMS({
      attributions: [attribution],
      crossOrigin: 'anonymous',
      // eslint-disable-next-line @typescript-eslint/naming-convention
      params: { LAYERS: 'show:3' },
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
    }/proxy/hillshade?url=${encodeURIComponent(
      this.url.replace('XXXXXX', bbox)
    )}`;
    img.src = url;
  }
}
