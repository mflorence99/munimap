import { RootPage } from '../root/page';

import { ActivatedRoute } from '@angular/router';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { FilterFunction } from '@lib/ol/ol-adaptor-geojson';
import { GeoJSONService } from '@lib/services/geojson';
import { Index } from '@lib/common';
import { OLLayerVectorComponent } from '@lib/ol/ol-layer-vector';
import { Path } from '@lib/state/view';
import { Router } from '@angular/router';
import { TownIndex } from '@lib/common';
import { ViewChild } from '@angular/core';

import { environment } from '@lib/environment';
import { inject } from '@angular/core';
import { theState } from '@lib/common';

import OLFeature from 'ol/Feature';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-create',
  template: `
    <app-ol-map #olMap [fitToBounds]="true" [path]="path">
      <app-builder
        (pathChanged)="onPathChanged($event)"
        (pathSelected)="onPathSelected($event)"
        (typeChanged)="onTypeChanged($event)"
        [path]="path"
        [type]="type"
        mapControlPanel1></app-builder>

      <!-- 📦 CUSTOM CONTROLS -->

      <app-ol-control-zoom2extent
        mapControlZoomToExtent></app-ol-control-zoom2extent>

      <app-ol-control-attribution
        mapControlAttribution></app-ol-control-attribution>

      @if (olMap.initialized) {
        <!-- 📦 OL CONTROLS -->

        <app-ol-control-graticule>
          <app-ol-style-graticule></app-ol-style-graticule>
        </app-ol-control-graticule>

        <app-ol-control-scaleline></app-ol-control-scaleline>

        <!-- 📦 BG LAYER -->

        <app-ol-layer-tile>
          <app-ol-source-xyz
            [url]="
              'https://api.mapbox.com/styles/v1/mapbox/streets-v9/tiles/256/{z}/{x}/{y}?access_token=' +
              env.mapbox.apiKey
            ">
            <app-ol-attribution>
              ©
              <a href="https://mapbox.com" target="_blank">Mapbox</a>
            </app-ol-attribution>
          </app-ol-source-xyz>
        </app-ol-layer-tile>

        <!-- 📦 SELECTABLES LAYER -->

        @if (!atTownLevel(path)) {
          <app-ol-layer-vector #selectables>
            <app-ol-adaptor-geojson [filter]="filter()">
              <app-ol-style-universal [showAll]="true"></app-ol-style-universal>
            </app-ol-adaptor-geojson>
            <app-ol-source-geojson
              [layerKey]="'selectables'"></app-ol-source-geojson>
            <app-ol-interaction-selectgeojson
              (featuresSelected)="onFeaturesSelected($event)"
              [filter]="filter()"></app-ol-interaction-selectgeojson>
          </app-ol-layer-vector>
        }

        <!-- 📦 BOUNDARY LAYER -->

        @if (atTownLevel(path)) {
          <app-ol-layer-vector>
            <app-ol-adaptor-geojson>
              <app-ol-style-universal [showAll]="true"></app-ol-style-universal>
            </app-ol-adaptor-geojson>
            <app-ol-source-boundary></app-ol-source-boundary>
          </app-ol-layer-vector>
        }
      }
    </app-ol-map>
  `,
  styleUrls: ['../abstract-map.scss']
})
export class CreatePage {
  @ViewChild('selectables') selectables: OLLayerVectorComponent;

  env = environment;
  index: Index;
  path = theState;
  type = 'parcels';

  #geoJSON = inject(GeoJSONService);
  #root = inject(RootPage);
  #route = inject(ActivatedRoute);
  #router = inject(Router);

  constructor() {
    this.index = this.#geoJSON.findIndex(this.#route);
    this.#root.setTitle(this.path);
  }

  atCountyLevel(path: Path): boolean {
    return path.split(':').length === 2;
  }

  atStateLevel(path: Path): boolean {
    return path.split(':').length === 1;
  }

  atTownLevel(path: Path): boolean {
    return path.split(':').length === 3;
  }

  currentCounty(): string {
    return this.path.split(':')[1];
  }

  currentState(): string {
    return this.path.split(':')[0];
  }

  currentTown(): string {
    return this.path.split(':')[2];
  }

  filter(): FilterFunction {
    return (name: string): boolean => {
      if (this.atCountyLevel(this.path)) {
        const townIndex = this.index[this.currentState()][this.currentCounty()][
          name
        ] as TownIndex;
        return (
          !['dpw', 'parcels'].includes(this.type) ||
          townIndex?.layers.parcels.available
        );
      } else return true;
    };
  }

  onFeaturesSelected(features: OLFeature<any>[]): void {
    this.path += `:${features[0].getId()}`;
    this.#root.setTitle(this.path);
  }

  onPathChanged(path: string): void {
    this.path = path;
    this.#root.setTitle(this.path);
  }

  onPathSelected(path: string): void {
    this.#router.navigate([`/${this.type}/0`], { queryParams: { path } });
  }

  onTypeChanged(type: string): void {
    this.type = type;
    if (this.selectables) this.selectables.olLayer.getSource().refresh();
  }
}
