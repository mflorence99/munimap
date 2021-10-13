import { GeoJSONService } from '../services/geojson';
import { MapState } from '../state/map';
import { UpdateView } from '../state/map';
import { View } from '../state/map';

import { ActivatedRoute } from '@angular/router';
import { AfterContentInit } from '@angular/core';
import { ChangeDetectionStrategy } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { Component } from '@angular/core';
import { ElementRef } from '@angular/core';
import { Input } from '@angular/core';
import { Store } from '@ngxs/store';

import { fromLonLat } from 'ol/proj';
import { toLonLat } from 'ol/proj';

import OLMap from 'ol/Map';
import OLView from 'ol/View';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-map',
  template: '<ng-content></ng-content>',
  styles: [
    `
      :host {
        background: url('/assets/halftone.svg');
        display: block;
        height: 100%;
        width: 100%;
      }
    `
  ]
})
export class OLMapComponent implements AfterContentInit {
  #view: View;
  boundary: GeoJSON.FeatureCollection<GeoJSON.Polygon>;
  initialized = false;
  olMap: OLMap;
  olView: OLView;
  projection = 'EPSG:3857';

  @Input()
  get view(): View {
    return this.#view;
  }
  set view(view: View) {
    this.#view = view;
    if (!this.olView) this.#initializeView();
  }

  constructor(
    private cdf: ChangeDetectorRef,
    private geoJSON: GeoJSONService,
    private host: ElementRef,
    private route: ActivatedRoute,
    private store: Store
  ) {
    this.olMap = new OLMap({
      controls: [],
      layers: undefined,
      target: undefined,
      view: undefined
    });
  }

  #createView(): void {
    const bbox = this.boundary.features[0].bbox;
    const [minX, minY, maxX, maxY] = bbox;
    this.olView = new OLView({
      center: fromLonLat(
        this.view.center ?? [minX + (maxX - minX) / 2, minY + (maxY - minY) / 2]
      ),
      zoom: this.view.zoom ?? MapState.defaultZoom(this.view.path)
    });
    this.olMap.setView(this.olView);
    // 👉 handle events
    this.olView.on('change', () => {
      this.store.dispatch(
        new UpdateView({
          center: toLonLat(this.olView.getCenter()),
          path: this.view.path,
          zoom: this.olView.getZoom()
        })
      );
    });
  }

  #initializeView(): void {
    this.geoJSON
      .loadByIndex(this.route, this.view.path, 'boundary')
      .subscribe((boundary: GeoJSON.FeatureCollection<GeoJSON.Polygon>) => {
        this.boundary = boundary;
        this.#createView();
        this.initialized = true;
        this.cdf.markForCheck();
      });
  }

  ngAfterContentInit(): void {
    this.olMap.setTarget(this.host.nativeElement);
  }
}
