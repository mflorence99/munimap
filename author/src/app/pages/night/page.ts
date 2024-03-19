import { AbstractMapPage } from '../abstract-map';
import { ContextMenuHostDirective } from '../../directives/contextmenu-host';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { DestroyService } from '@lib/services/destroy';
import { MapType } from '@lib/state/map';
import { MatDrawer } from '@angular/material/sidenav';
import { OLMapComponent } from '@lib/ol/ol-map';
import { OnInit } from '@angular/core';

import { viewChild } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DestroyService],
  selector: 'app-night',
  template: `
    <app-sink
      #sink
      [mapState]="root.mapState$ | async"
      [profile]="root.profile$ | async"
      [satelliteView]="root.satelliteView$ | async"
      [user]="root.user$ | async" />

    @if (sink.mapState) {
      <app-ol-map
        #map
        [loadingStrategy]="'bbox'"
        [minZoom]="13"
        [maxZoom]="20"
        [path]="sink.mapState.path">
        <app-controlpanel-properties
          [mapState]="sink.mapState"
          mapControlPanel1></app-controlpanel-properties>

        <app-ol-control-zoom mapControlZoom></app-ol-control-zoom>

        @if (sink.mapState.name) {
          <app-ol-control-print
            [fileName]="sink.mapState.name"
            [printSize]="sink.mapState.printSize"
            mapControlPrint></app-ol-control-print>
        }

        <app-ol-control-zoom2extent
          mapControlZoomToExtent></app-ol-control-zoom2extent>

        <app-ol-control-attribution
          mapControlAttribution></app-ol-control-attribution>

        @if (map.initialized) {
          <!-- 📦 OL CONTROLS -- WILL BE PRINTED -->

          @if (map.printing) {
            <app-ol-control-title
              [showTitleContrast]="sink.satelliteView"
              [title]="sink.mapState.name"></app-ol-control-title>
          }
          @if (map.printing) {
            <app-ol-control-graticule>
              <app-ol-style-graticule
                [printing]="true"></app-ol-style-graticule>
            </app-ol-control-graticule>
          }
          @if (!map.printing) {
            <app-ol-control-graticule>
              <app-ol-style-graticule></app-ol-style-graticule>
            </app-ol-control-graticule>
          }

          <!-- 📦 NORMAL (not satellite) LAYERS -->

          @if (!sink.satelliteView) {
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

          @if (sink.satelliteView) {
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
  contextMenuHost = viewChild(ContextMenuHostDirective);
  drawer = viewChild(MatDrawer);
  map = viewChild(OLMapComponent);

  getType(): MapType {
    return 'night';
  }

  ngOnInit(): void {
    this.onInit();
  }
}
