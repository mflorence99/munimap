/* eslint-disable @typescript-eslint/naming-convention */

import { OLLayerTileComponent } from './ol-layer-tile';
import { OLMapComponent } from './ol-map';

import { environment } from '../environment';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpResponse } from '@angular/common/http';
import { Input } from '@angular/core';

import { catchError } from 'rxjs/operators';
import { map } from 'rxjs/operators';

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
  #origOpacity: number;

  // 👉 the fallback contours are WAAY to heavy
  @Input() fallbackOpacity = 0.33;

  // 👇 https://carto.nationalmap.gov/arcgis/rest/services/contours/MapServer
  @Input() layers = [
    1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 12, 13, 15, 16, 17, 18, 21, 22, 25, 26
  ];

  olTileWMS: OLTileWMS;

  // 👇 the preferred source for contours is best because it
  //    includes an elevation annotation -- but it is unreliable,
  //    often throwing 503 or 504 errors

  urlFallback =
    'https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer/exportImage?f=image&format=jpgpng&renderingRule=YYYYYY&bbox=XXXXXX&imageSR=102100&bboxSR=102100&size=256,256';

  urlPreferred =
    'https://carto.nationalmap.gov/arcgis/rest/services/contours/MapServer/export?bbox=XXXXXX&bboxSR=102100&imageSR=102100&size=256,256&dpi=96&format=png32&transparent=true&layers=show:ZZZZZZ&f=image';

  constructor(
    private http: HttpClient,
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
    this.layer.olLayer.setSource(this.olTileWMS);
    // 👇 capture the original opacity so we can restore it
    this.#origOpacity = this.layer.olLayer.getOpacity();
  }

  #loader(tile: OLImageTile, src: string): void {
    // 👇 restore the original layer opacity
    //    see catchError below
    this.layer.olLayer.setOpacity(this.#origOpacity);
    const img = tile.getImage() as HTMLImageElement;
    const url = this.#makeURL(src, this.urlPreferred);
    this.http
      .get(url, { observe: 'response', responseType: 'blob' })
      .pipe(
        catchError(() => {
          // 👉 the fallback contours are WAAY to heavy
          this.layer.olLayer.setOpacity(this.fallbackOpacity);
          const url = this.#makeURL(src, this.urlFallback);
          return this.http.get(url, {
            observe: 'response',
            responseType: 'blob'
          });
        }),
        map((response: HttpResponse<Blob>) =>
          URL.createObjectURL(response.body)
        )
      )
      .subscribe((url: string) => {
        img.src = url;
      });
  }

  #makeURL(src: string, model: string): string {
    const parsed = new URL(src);
    const bbox = parsed.searchParams.get('BBOX');
    const renderingRule = {
      rasterFunction: 'Contour 25',
      rasterFunctionArguments: {}
    };
    return `${
      environment.endpoints.proxy
    }/proxy/contours?url=${encodeURIComponent(
      model
        .replace('XXXXXX', bbox)
        .replace('YYYYYY', JSON.stringify(renderingRule))
        .replace('ZZZZZZ', this.layers.join(','))
    )}`;
  }
}
