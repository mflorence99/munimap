import { OLAttributionComponent } from './ol-attribution';
import { OLLayerTileComponent } from './ol-layer-tile';

import { environment } from '../environment';

import { AfterContentInit } from '@angular/core';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { ContentChildren } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Input } from '@angular/core';
import { OnInit } from '@angular/core';
import { QueryList } from '@angular/core';

import { retryBackoff } from 'backoff-rxjs';

import OLERROR from 'ol/TileState';
import OLImageTile from 'ol/ImageTile';
import OLXYZ from 'ol/source/XYZ';

const backoffInitialInterval = 1000;
const backoffMaxInterval = 5000;
const backoffMaxRetries = 10;

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-source-xyz',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLSourceXYZComponent implements AfterContentInit, OnInit {
  @ContentChildren(OLAttributionComponent)
  attributions: QueryList<OLAttributionComponent>;

  @Input() maxZoom: number;

  olXYZ: OLXYZ;

  @Input() url: string;

  constructor(private http: HttpClient, private layer: OLLayerTileComponent) {}

  // 👀 https://gis.stackexchange.com/questions/401266/openlayers-fallback-tiles-on-error-errortileurlfunction

  #loader(tile: OLImageTile, src: string): void {
    const img = tile.getImage() as HTMLImageElement;
    this.http
      .get(src, { responseType: 'blob' })
      .pipe(
        retryBackoff({
          initialInterval: backoffInitialInterval,
          maxInterval: backoffMaxInterval,
          maxRetries: backoffMaxRetries,
          resetOnSuccess: true
        })
      )
      .subscribe({
        error: () => tile.setState(OLERROR),
        next: (blob) => {
          const objectURL = URL.createObjectURL(blob);
          img.src = objectURL;
        }
      });
  }

  ngAfterContentInit(): void {
    // 👉 note that we're saying we don't expect
    //    the list of attributions to change
    this.olXYZ.setAttributions(
      this.attributions.map((attribution) => attribution.getAttribution())
    );
    this.layer.olLayer.setSource(this.olXYZ);
  }

  ngOnInit(): void {
    // 👉 we can't follow the normal convention and put this in the
    //    constructor as there few "set" methods
    const parsed = new URL(this.url);
    const encoded = encodeURIComponent(this.url);
    this.olXYZ = new OLXYZ({
      crossOrigin: 'anonymous',
      maxZoom: this.maxZoom,
      tileLoadFunction: this.#loader.bind(this),
      url: `${environment.endpoints.proxy}/proxy/${parsed.hostname}?url=${encoded}&x={x}&y={y}&z={z}`
    });
  }
}
