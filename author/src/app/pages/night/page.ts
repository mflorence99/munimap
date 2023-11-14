import { AbstractMapPage } from '../abstract-map';
import { ContextMenuHostDirective } from '../../directives/contextmenu-host';
import { RootPage } from '../root/page';

import { Actions } from '@ngxs/store';
import { ActivatedRoute } from '@angular/router';
import { AuthState } from '@lib/state/auth';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { DestroyService } from '@lib/services/destroy';
import { Map } from '@lib/state/map';
import { MapState } from '@lib/state/map';
import { MapType } from '@lib/state/map';
import { MatDrawer } from '@angular/material/sidenav';
import { Observable } from 'rxjs';
import { OLMapComponent } from '@lib/ol/ol-map';
import { OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Select } from '@ngxs/store';
import { Store } from '@ngxs/store';
import { ViewChild } from '@angular/core';
import { ViewState } from '@lib/state/view';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DestroyService],
  selector: 'app-night',
  template: `
    @if (mapState$ | async; as map) {
      <app-ol-map
        #olMap
        [loadingStrategy]="'bbox'"
        [minZoom]="13"
        [maxZoom]="20"
        [path]="map.path">
        <app-controlpanel-properties
          [map]="map"
          mapControlPanel1></app-controlpanel-properties>

        <app-ol-control-zoom mapControlZoom></app-ol-control-zoom>

        @if (map.name) {
          <app-ol-control-print
            [fileName]="map.name"
            [printSize]="map.printSize"
            mapControlPrint></app-ol-control-print>
        }

        <app-ol-control-zoom2extent
          mapControlZoomToExtent></app-ol-control-zoom2extent>

        <app-ol-control-attribution
          mapControlAttribution></app-ol-control-attribution>

        @if (olMap.initialized) {
          <!-- 📦 OL CONTROLS -- WILL BE PRINTED -->

          @if (olMap.printing) {
            <app-ol-control-title
              [showTitleContrast]="satelliteView$ | async"
              [title]="map.name"></app-ol-control-title>
          }
          @if (olMap.printing) {
            <app-ol-control-graticule>
              <app-ol-style-graticule
                [printing]="true"></app-ol-style-graticule>
            </app-ol-control-graticule>
          }
          @if (!olMap.printing) {
            <app-ol-control-graticule>
              <app-ol-style-graticule></app-ol-style-graticule>
            </app-ol-control-graticule>
          }

          <!-- 📦 NORMAL (not satellite) LAYERS -->

          @if (!(satelliteView$ | async)) {
            <!-- 📦 BG LAYER (outside town)-->

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
              <app-ol-filter-colorize
                [color]="'#FFFFFF'"
                [operation]="'hue'"
                [value]="0.9"></app-ol-filter-colorize>
            </app-ol-layer-tile>

            <!-- 📦 BG LAYER (inside town) -->

            <app-ol-layer-vector>
              <app-ol-adaptor-background>
                <app-ol-style-universal
                  [showAll]="true"></app-ol-style-universal>
              </app-ol-adaptor-background>
              <app-ol-source-boundary></app-ol-source-boundary>
              <app-ol-filter-crop2boundary></app-ol-filter-crop2boundary>
            </app-ol-layer-vector>

            <!-- 📦 Water under moonlight -->

            <app-ol-layer-vector>
              <app-ol-adaptor-waterbodiesatnight>
                <app-ol-style-universal
                  [showAll]="true"></app-ol-style-universal>
              </app-ol-adaptor-waterbodiesatnight>
              <!-- 👇 exclude swamp/marsh b/c floodplain source below does it better -->
              <app-ol-source-waterbodies
                [exclude]="[466]"></app-ol-source-waterbodies>
              <app-ol-filter-crop2boundary></app-ol-filter-crop2boundary>
            </app-ol-layer-vector>

            <!-- 📦 Buildings with lights on -->

            <app-ol-layer-vector>
              <app-ol-adaptor-buildingsatnight>
                <app-ol-style-universal
                  [showAll]="true"></app-ol-style-universal>
              </app-ol-adaptor-buildingsatnight>
              <app-ol-source-geojson
                [layerKey]="'buildings'"></app-ol-source-geojson>
              <app-ol-filter-crop2boundary></app-ol-filter-crop2boundary>
            </app-ol-layer-vector>
          }

          <!-- 📦 SATELLITE LAYER  -->

          @if (satelliteView$ | async) {
            <app-ol-layer-tile>
              <app-ol-source-xyz
                [s]="['mt0', 'mt1', 'mt2', 'mt3']"
                [url]="
                  'https://{s}.google.com/vt/lyrs=s,h&hl=en&gl=en&x={x}&y={y}&z={z}&s=png&key=' +
                  env.google.apiKey
                ">
                <app-ol-attribution>
                  ©
                  <a href="https://google.com" target="_blank">Google</a>
                </app-ol-attribution>
              </app-ol-source-xyz>
            </app-ol-layer-tile>
          }
        }

        <!-- 📦 CONTROLS -->
      </app-ol-map>
    }
  `,
  styleUrls: ['../abstract-map.scss']
})
export class NightPage extends AbstractMapPage implements OnInit {
  @ViewChild(ContextMenuHostDirective)
  contextMenuHost: ContextMenuHostDirective;

  @ViewChild('drawer') drawer: MatDrawer;

  @Select(MapState) mapState$: Observable<Map>;

  @ViewChild(OLMapComponent) olMap: OLMapComponent;

  @Select(ViewState.satelliteView) satelliteView$: Observable<boolean>;

  constructor(
    protected override actions$: Actions,
    protected override authState: AuthState,
    protected override destroy$: DestroyService,
    protected override root: RootPage,
    protected override route: ActivatedRoute,
    protected override router: Router,
    protected override store: Store,
    protected override viewState: ViewState
  ) {
    super(actions$, authState, destroy$, root, route, router, store, viewState);
  }

  getType(): MapType {
    return 'night';
  }

  ngOnInit(): void {
    this.onInit();
  }
}
