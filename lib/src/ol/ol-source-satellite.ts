import { OLLayerTileComponent } from './ol-layer-tile';
import { OLMapComponent } from './ol-map';

import { environment } from '../environment';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';

import OLImageTile from 'ol/ImageTile';
import OLTileWMS from 'ol/source/TileWMS';

const attribution =
  '<a href="https://granitview.unh.edu/html5viewer/index.html?viewer=granit_view" target="_blank">GRANIT<i>View</i></a>';

const urls = {
  '2018':
    'https://nhgeodata.unh.edu/nhgeodata/rest/services/IBM/Orthophotography/MapServer/export?dpi=96&transparent=true&format=png32&layers=show%3A68&dynamicLayers=%5B%7B%22id%22%3A68%2C%22name%22%3A%22NH%20NAIP%202018%20RGB%22%2C%22source%22%3A%7B%22type%22%3A%22mapLayer%22%2C%22mapLayerId%22%3A68%7D%2C%22minScale%22%3A0%2C%22maxScale%22%3A0%7D%5D&bbox=XXXXXX&bboxSR=102100&imageSR=102100&size=256,256&f=image',
  '2016':
    'https://nhgeodata.unh.edu/nhgeodata/rest/services/IBM/Orthophotography/MapServer/export?dpi=96&transparent=true&format=png32&layers=show%3A70&dynamicLayers=%5B%7B%22id%22%3A70%2C%22name%22%3A%22NH%20NAIP%202016%20RGB%22%2C%22source%22%3A%7B%22type%22%3A%22mapLayer%22%2C%22mapLayerId%22%3A70%7D%2C%22minScale%22%3A0%2C%22maxScale%22%3A0%7D%5D&bbox=XXXXXX&bboxSR=102100&imageSR=102100&size=256,256&f=image',
  '2015':
    'https://nhgeodata.unh.edu/nhgeodata/rest/services/IBM/Orthophotography/MapServer/export?dpi=96&transparent=true&format=png32&layers=show%3A55&dynamicLayers=%5B%7B%22id%22%3A55%2C%22name%22%3A%22NH%202015%201-foot%20RGB%20Image%22%2C%22source%22%3A%7B%22type%22%3A%22mapLayer%22%2C%22mapLayerId%22%3A55%7D%2C%22minScale%22%3A0%2C%22maxScale%22%3A0%7D%5D&bbox=XXXXXX&bboxSR=102100&imageSR=102100&size=256,256&f=image',
  '2014':
    'https://nhgeodata.unh.edu/nhgeodata/rest/services/IBM/Orthophotography/MapServer/export?dpi=96&transparent=true&format=png32&layers=show%3A72&dynamicLayers=%5B%7B%22id%22%3A72%2C%22name%22%3A%22NH%20NAIP%202014%20RGB%22%2C%22source%22%3A%7B%22type%22%3A%22mapLayer%22%2C%22mapLayerId%22%3A72%7D%2C%22minScale%22%3A0%2C%22maxScale%22%3A0%7D%5D&bbox=XXXXXX&bboxSR=102100&imageSR=102100&size=256,256&f=image',
  '2012':
    'https://nhgeodata.unh.edu/nhgeodata/rest/services/IBM/Orthophotography/MapServer/export?dpi=96&transparent=true&format=png32&layers=show%3A74&dynamicLayers=%5B%7B%22id%22%3A74%2C%22name%22%3A%22NH%20NAIP%202012%20RGB%22%2C%22source%22%3A%7B%22type%22%3A%22mapLayer%22%2C%22mapLayerId%22%3A74%7D%2C%22minScale%22%3A0%2C%22maxScale%22%3A0%7D%5D&bbox=XXXXXX&bboxSR=102100&imageSR=102100&size=256,256&f=image',
  '2010':
    'https://nhgeodata.unh.edu/nhgeodata/rest/services/IBM/Orthophotography/MapServer/export?dpi=96&transparent=true&format=png32&layers=show%3A63&dynamicLayers=%5B%7B%22id%22%3A63%2C%22name%22%3A%22NH%202010%202011%201-foot%20RGB%20Image%22%2C%22source%22%3A%7B%22type%22%3A%22mapLayer%22%2C%22mapLayerId%22%3A63%7D%2C%22minScale%22%3A0%2C%22maxScale%22%3A0%7D%5D&bbox=XXXXXX&bboxSR=102100&imageSR=102100&size=256,256&f=image',
  '2009':
    'https://nhgeodata.unh.edu/nhgeodata/rest/services/IBM/Orthophotography/MapServer/export?dpi=96&transparent=true&format=png32&layers=show%3A78&dynamicLayers=%5B%7B%22id%22%3A78%2C%22name%22%3A%22NH%20NAIP%202009%20RGB%22%2C%22source%22%3A%7B%22type%22%3A%22mapLayer%22%2C%22mapLayerId%22%3A78%7D%2C%22minScale%22%3A0%2C%22maxScale%22%3A0%7D%5D&bbox=XXXXXX&bboxSR=102100&imageSR=102100&size=256,256&f=image',
  '2008':
    'https://nhgeodata.unh.edu/nhgeodata/rest/services/IBM/Orthophotography/MapServer/export?dpi=96&transparent=true&format=png32&layers=show%3A79&dynamicLayers=%5B%7B%22id%22%3A79%2C%22name%22%3A%22NH%20NAIP%202008%20RGB%22%2C%22source%22%3A%7B%22type%22%3A%22mapLayer%22%2C%22mapLayerId%22%3A79%7D%2C%22minScale%22%3A0%2C%22maxScale%22%3A0%7D%5D&bbox=XXXXXX&bboxSR=102100&imageSR=102100&size=256,256&f=image',
  '2003':
    'https://nhgeodata.unh.edu/nhgeodata/rest/services/IBM/Orthophotography/MapServer/export?dpi=96&transparent=true&format=png32&layers=show%3A83&dynamicLayers=%5B%7B%22id%22%3A83%2C%22name%22%3A%22NH%20NAIP%202003%20RGB%20Image%22%2C%22source%22%3A%7B%22type%22%3A%22mapLayer%22%2C%22mapLayerId%22%3A83%7D%2C%22minScale%22%3A0%2C%22maxScale%22%3A0%7D%5D&bbox=XXXXXX&bboxSR=102100&imageSR=102100&size=256,256&f=image',
  '1992':
    'https://nhgeodata.unh.edu/nhgeodata/rest/services/IBM/Orthophotography/MapServer/export?dpi=96&transparent=true&format=png32&layers=show%3A84&dynamicLayers=%5B%7B%22id%22%3A84%2C%22name%22%3A%22NH%20DOQs%201992%2F98%22%2C%22source%22%3A%7B%22type%22%3A%22mapLayer%22%2C%22mapLayerId%22%3A84%7D%2C%22minScale%22%3A0%2C%22maxScale%22%3A0%7D%5D&bbox=XXXXXX&bboxSR=102100&imageSR=102100&size=256,256&f=image'
};

export const satelliteYears = Object.keys(urls);

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-source-satellite',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLSourceSatelliteComponent {
  olTileWMS: OLTileWMS;

  #year: string;

  constructor(
    private layer: OLLayerTileComponent,
    private map: OLMapComponent
  ) {
    this.olTileWMS = new OLTileWMS({
      attributions: [attribution],
      crossOrigin: 'anonymous',
      params: { LAYERS: 'dummy' },
      tileLoadFunction: this.#loader.bind(this),
      url: 'http://dummy.com'
    });
    this.olTileWMS.setProperties({ component: this }, true);
    this.layer.olLayer.setSource(this.olTileWMS);
  }

  @Input() get year(): string {
    return this.#year;
  }

  set year(value: string) {
    if (this.#year && this.#year !== value) this.olTileWMS.refresh();
    this.#year = value;
  }

  #loader(tile: OLImageTile, src: string): void {
    const img = tile.getImage() as HTMLImageElement;
    const parsed = new URL(src);
    const bbox = parsed.searchParams.get('BBOX');
    const url = `${
      environment.endpoints.proxy
    }/proxy/satellite?url=${encodeURIComponent(
      urls[this.year].replace('XXXXXX', bbox)
    )}`;
    img.src = url;
  }
}
