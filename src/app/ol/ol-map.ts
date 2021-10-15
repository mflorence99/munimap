import { GeoJSONService } from '../services/geojson';
import { MapableComponent } from './ol-mapable';
import { UpdateView } from '../state/view';
import { View } from '../state/view';
import { ViewState } from '../state/view';

import { ActivatedRoute } from '@angular/router';
import { AfterContentInit } from '@angular/core';
import { ChangeDetectionStrategy } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { Component } from '@angular/core';
import { ContentChildren } from '@angular/core';
import { ElementRef } from '@angular/core';
import { Input } from '@angular/core';
import { OnDestroy } from '@angular/core';
import { QueryList } from '@angular/core';
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
        background: white;
        display: block;
        height: 100%;
        width: 100%;
      }
    `
  ]
})
export class OLMapComponent implements AfterContentInit, OnDestroy {
  #view: View;

  boundary: GeoJSON.FeatureCollection<GeoJSON.Polygon>;
  initialized = false;

  @ContentChildren(MapableComponent, { descendants: true })
  mapables$: QueryList<any>;

  olMap: OLMap;
  olView: OLView;
  projection = 'EPSG:3857';

  @Input()
  get view(): View {
    return this.#view;
  }
  set view(view: View) {
    this.#view = this.#initializeView(view);
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
      layers: null,
      target: null,
      view: null
    });
  }

  #cleanMap(): void {
    this.olMap
      .getControls()
      .forEach((control) => this.olMap.removeControl(control));
    this.olMap.getInteractions().forEach((interaction) => {
      // 👉 OL adds a bunch of interactions of its own
      //    that we don't want to remove
      if (interaction['addToMap']) this.olMap.removeInteraction(interaction);
    });
    this.olMap.getLayers().forEach((layer) => this.olMap.removeLayer(layer));
  }

  #createView(
    view: View,
    boundary: GeoJSON.FeatureCollection<GeoJSON.Polygon>
  ): void {
    const bbox = boundary.features[0].bbox;
    const [minX, minY, maxX, maxY] = bbox;
    this.olView = new OLView({
      center: fromLonLat(
        view.center ?? [minX + (maxX - minX) / 2, minY + (maxY - minY) / 2]
      ),
      zoom: view.zoom ?? ViewState.defaultZoom(view.path)
    });
    this.olMap.setView(this.olView);
    this.boundary = boundary;
    // 👉 handle events
    this.olView.on('change', this.#onChange.bind(this));
  }

  #handleMapables$(): void {
    this.mapables$.changes.subscribe((list) => {
      this.#cleanMap();
      list.forEach((mapable) => mapable.addToMap());
    });
  }

  #initializeView(view: View): View {
    // 👉 if the path has changed, clean out the old map
    if (view.path !== this.#view?.path) {
      this.initialized = false;
      this.#cleanMap();
      this.olView = null;
    }
    // 👉 now create the new
    if (!this.olView) {
      this.geoJSON
        .loadByIndex(this.route, view.path, 'boundary')
        .subscribe((boundary: GeoJSON.FeatureCollection<GeoJSON.Polygon>) => {
          this.#createView(view, boundary);
          this.initialized = true;
          this.cdf.markForCheck();
        });
    }
    return view;
  }

  #onChange(): void {
    this.store.dispatch(
      new UpdateView({
        center: toLonLat(this.olView.getCenter()),
        path: this.view.path,
        zoom: this.olView.getZoom()
      })
    );
  }

  ngAfterContentInit(): void {
    this.olMap.setTarget(this.host.nativeElement);
    // handle content changes
    this.#handleMapables$();
  }

  ngOnDestroy(): void {
    this.olView.un('change', this.#onChange.bind(this));
  }
}
