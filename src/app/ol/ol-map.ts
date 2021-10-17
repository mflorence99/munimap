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
import { Coordinate } from 'ol/coordinate';
import { ElementRef } from '@angular/core';
import { Input } from '@angular/core';
import { OnDestroy } from '@angular/core';
import { QueryList } from '@angular/core';
import { Store } from '@ngxs/store';
import { ViewChild } from '@angular/core';

import { fromLonLat } from 'ol/proj';
import { toLonLat } from 'ol/proj';
import { transformExtent } from 'ol/proj';

import OLMap from 'ol/Map';
import OLView from 'ol/View';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-map',
  template: `
    <canvas #measurator hidden></canvas>
    <ng-content></ng-content>
  `,
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
  boundaryExtent: Coordinate;
  initialized = false;

  @ContentChildren(MapableComponent, { descendants: true })
  mapables$: QueryList<any>;

  @ViewChild('measurator') measurator: ElementRef<HTMLCanvasElement>;

  olMap: OLMap;
  olView: OLView;
  projection = 'EPSG:3857';
  vars: Record<string, string> = {};

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
    // 👉 get these up front, all at once,
    //    meaning we don't expect them to change
    this.vars = this.#findAllCustomVariables();
  }

  // 👇 https://stackoverflow.com/questions/40862706
  #cleanMap(): void {
    const controls = [...this.olMap.getControls().getArray()];
    controls.forEach((control) => this.olMap.removeControl(control));
    const interactions = [...this.olMap.getInteractions().getArray()];
    interactions.forEach((interaction) => {
      // 👉 OL adds a bunch of interactions of its own
      //    that we don't want to remove
      if (interaction['addToMap']) this.olMap.removeInteraction(interaction);
    });
    const layers = [...this.olMap.getLayers().getArray()];
    layers.forEach((layer) => this.olMap.removeLayer(layer));
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
    // 👉 precompute boundary extent
    this.boundary = boundary;
    // 👉 TODO: ambient typings missing this
    const featureProjection = boundary['crs'].properties.name;
    this.boundaryExtent = transformExtent(
      bbox,
      featureProjection,
      this.projection
    );
    // 👉 handle events
    this.olView.on('change', this.#onChange.bind(this));
  }

  #findAllCustomVariables(): Record<string, string> {
    // 👉 https://stackoverflow.com/questions/48760274
    const names = Array.from(document.styleSheets)
      .filter(
        (sheet) =>
          sheet.href === null || sheet.href.startsWith(window.location.origin)
      )
      .reduce(
        (acc, sheet) =>
          (acc = [
            ...acc,
            ...Array.from(sheet.cssRules).reduce(
              (def, rule: any) =>
                (def =
                  rule.selectorText === ':root'
                    ? [
                        ...def,
                        ...Array.from(rule.style).filter((name: any) =>
                          name.startsWith('--map')
                        )
                      ]
                    : def),
              []
            )
          ]),
        []
      );
    const style = getComputedStyle(document.documentElement);
    // 👉now organize them as { name: value }
    return names.reduce((acc, name) => {
      acc[name] = style.getPropertyValue(name).trim();
      return acc;
    }, {});
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
    const center = toLonLat(this.olView.getCenter());
    const path = this.view.path;
    const resolution = this.olView.getResolution();
    const zoom = this.olView.getZoom();
    console.log(
      `%c${path}`,
      'color: hotpink',
      `resolution=${resolution} zoom=${zoom}`
    );
    this.store.dispatch(new UpdateView({ center, path, zoom }));
  }

  measureText(text: string, font: string): TextMetrics {
    const ctx = this.measurator.nativeElement.getContext('2d');
    ctx.font = font;
    return ctx.measureText(text);
  }

  ngAfterContentInit(): void {
    this.olMap.setTarget(this.host.nativeElement);
    // 👉 handle content changes
    this.#handleMapables$();
  }

  ngOnDestroy(): void {
    this.olView.un('change', this.#onChange.bind(this));
  }
}
