import { RootPage } from '../root/page';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';

import { environment } from '@lib/environment';
import { inject } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-topo',
  template: `
    <app-sink
      #sink
      [gps]="root.gps$ | async"
      [mapState]="root.map$ | async"
      [user]="root.user$ | async"
      [zoom]="root.zoom$ | async" />

    @if (sink.mapState) {
      <app-ol-map
        #map
        [loadingStrategy]="'bbox'"
        [minZoom]="13"
        [maxZoom]="20"
        [path]="sink.mapState.path"
        class="content">
        <!-- 📦 CONTROLS -->

        @if (sink.zoom >= map.minUsefulZoom()) {
          <app-ol-control-searchparcels
            mapControlSearch></app-ol-control-searchparcels>
        }

        <app-ol-control-plusminus mapControlZoom></app-ol-control-plusminus>

        <app-ol-control-attribution
          mapControlAttribution></app-ol-control-attribution>

        @if (map.initialized) {
          <!-- 📦 OL CONTROLS -->

          <app-ol-control-graticule>
            <app-ol-style-graticule></app-ol-style-graticule>
          </app-ol-control-graticule>

          <app-ol-control-scaleline></app-ol-control-scaleline>

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

          <app-ol-control-splitscreen>
            <app-ol-layers #left>
              <!-- 📦 HILLSHADE LAYER 🔥 appears to throw 502 12/13/2023 -->

              <!-- <app-ol-layer-tile [opacity]="0.5">
              <app-ol-source-hillshade
                [colorize]="true"></app-ol-source-hillshade>
              <app-ol-filter-crop2boundary></app-ol-filter-crop2boundary>
            </app-ol-layer-tile> -->

              <!-- 📦 HILLSHADE LAYER 🔥 replaces above -->

              <app-ol-layer-tile>
                <app-ol-source-xyz
                  [maxZoom]="16"
                  [url]="
                    'https://server.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade/MapServer/tile/{z}/{y}/{x}'
                  ">
                  <app-ol-attribution>
                    <a href="https://www.esri.com" target="_blank">Esri</a>
                  </app-ol-attribution>
                </app-ol-source-xyz>
                <app-ol-filter-colorize
                  [color]="'#f8fc03'"
                  [operation]="'color'"
                  [value]="0.1"></app-ol-filter-colorize>
                <app-ol-filter-crop2boundary></app-ol-filter-crop2boundary>
              </app-ol-layer-tile>

              <!-- 📦 CONTOURS LAYER -->

              <app-ol-layer-tile>
                <app-ol-source-contours></app-ol-source-contours>
                <app-ol-filter-crop2boundary></app-ol-filter-crop2boundary>
              </app-ol-layer-tile>

              <!-- 📦 NH GranIT VECTOR LAYERS -->

              <app-ol-layer-vector>
                <app-ol-adaptor-conservations>
                  <app-ol-style-universal
                    [showAll]="true"></app-ol-style-universal>
                </app-ol-adaptor-conservations>
                <app-ol-source-parcels></app-ol-source-parcels>
                <app-ol-filter-crop2boundary></app-ol-filter-crop2boundary>
              </app-ol-layer-vector>

              @if (sink.zoom >= map.minUsefulZoom()) {
                <app-ol-layer-vector>
                  <app-ol-adaptor-wetlands>
                    <app-ol-style-universal
                      [showAll]="true"></app-ol-style-universal>
                  </app-ol-adaptor-wetlands>
                  <app-ol-source-wetlands></app-ol-source-wetlands>
                  <app-ol-filter-crop2boundary></app-ol-filter-crop2boundary>
                </app-ol-layer-vector>
              }
              @if (sink.zoom >= map.minUsefulZoom()) {
                <app-ol-layer-vector>
                  <!-- 👇 only drawing labels here - waterbodies draws actual river -->
                  <app-ol-adaptor-places>
                    <app-ol-style-universal
                      [showText]="true"></app-ol-style-universal>
                  </app-ol-adaptor-places>
                  <app-ol-source-rivers></app-ol-source-rivers>
                  <app-ol-filter-crop2boundary></app-ol-filter-crop2boundary>
                </app-ol-layer-vector>
              }

              <app-ol-layer-vector>
                <app-ol-adaptor-waterbodies>
                  <app-ol-style-universal
                    [showAll]="true"></app-ol-style-universal>
                </app-ol-adaptor-waterbodies>
                <!-- 👇 exclude swamp/marsh b/c floodplain source below does it better -->
                <app-ol-source-waterbodies
                  [exclude]="[466]"></app-ol-source-waterbodies>
                <app-ol-filter-crop2boundary></app-ol-filter-crop2boundary>
              </app-ol-layer-vector>

              @if (sink.zoom >= map.minUsefulZoom()) {
                <app-ol-layer-vector>
                  <app-ol-adaptor-stonewalls>
                    <app-ol-style-universal
                      [showAll]="true"></app-ol-style-universal>
                  </app-ol-adaptor-stonewalls>
                  <app-ol-source-stonewalls></app-ol-source-stonewalls>
                  <app-ol-filter-crop2boundary></app-ol-filter-crop2boundary>
                </app-ol-layer-vector>
              }

              <app-ol-layer-vector>
                <app-ol-adaptor-floodplains>
                  <app-ol-style-universal
                    [showAll]="true"></app-ol-style-universal>
                </app-ol-adaptor-floodplains>
                <app-ol-source-floodplains></app-ol-source-floodplains>
                <app-ol-filter-crop2boundary></app-ol-filter-crop2boundary>
              </app-ol-layer-vector>

              @if (sink.zoom >= map.minUsefulZoom()) {
                <app-ol-layer-vector>
                  <app-ol-adaptor-buildings>
                    <app-ol-style-universal
                      [showAll]="true"></app-ol-style-universal>
                  </app-ol-adaptor-buildings>
                  <app-ol-source-geojson
                    [layerKey]="'buildings'"></app-ol-source-geojson>
                  <app-ol-filter-crop2boundary></app-ol-filter-crop2boundary>
                </app-ol-layer-vector>
              }
              @if (sink.zoom >= map.minUsefulZoom()) {
                <app-ol-layer-vector>
                  <app-ol-adaptor-railroads>
                    <app-ol-style-universal
                      [showAll]="true"></app-ol-style-universal>
                  </app-ol-adaptor-railroads>
                  <app-ol-source-railroads></app-ol-source-railroads>
                  <app-ol-filter-crop2boundary></app-ol-filter-crop2boundary>
                </app-ol-layer-vector>
              }

              <app-ol-layer-vector>
                <app-ol-adaptor-roads>
                  <app-ol-style-universal
                    [showAll]="true"></app-ol-style-universal>
                </app-ol-adaptor-roads>
                <app-ol-source-geojson
                  [layerKey]="'roads'"></app-ol-source-geojson>
                <app-ol-filter-crop2boundary></app-ol-filter-crop2boundary>
              </app-ol-layer-vector>

              @if (sink.zoom >= map.minUsefulZoom()) {
                <app-ol-layer-vector>
                  <app-ol-adaptor-trails>
                    <app-ol-style-universal
                      [showAll]="true"></app-ol-style-universal>
                  </app-ol-adaptor-trails>
                  <app-ol-source-geojson
                    [layerKey]="'trails'"></app-ol-source-geojson>
                  <app-ol-filter-crop2boundary></app-ol-filter-crop2boundary>
                </app-ol-layer-vector>
              }
              @if (sink.zoom >= map.minUsefulZoom()) {
                <app-ol-layer-vector>
                  <app-ol-adaptor-places>
                    <app-ol-style-universal
                      [showText]="true"></app-ol-style-universal>
                  </app-ol-adaptor-places>
                  <!-- 👇 dams excluded from "places" b/c "dams" below does it better -->
                  <app-ol-source-geojson
                    [exclude]="['dam', 'park']"
                    [layerKey]="'places'"></app-ol-source-geojson>
                  <app-ol-filter-crop2boundary></app-ol-filter-crop2boundary>
                </app-ol-layer-vector>
              }
              @if (sink.zoom >= map.minUsefulZoom()) {
                <app-ol-layer-vector>
                  <app-ol-adaptor-places>
                    <app-ol-style-universal
                      [showText]="true"></app-ol-style-universal>
                  </app-ol-adaptor-places>
                  <app-ol-source-dams></app-ol-source-dams>
                  <app-ol-filter-crop2boundary></app-ol-filter-crop2boundary>
                </app-ol-layer-vector>
              }
              @if (sink.zoom >= map.minUsefulZoom()) {
                <app-ol-layer-vector>
                  <app-ol-adaptor-places>
                    <app-ol-style-universal
                      [showText]="true"></app-ol-style-universal>
                  </app-ol-adaptor-places>
                  <app-ol-source-labels
                    [dedupe]="true"
                    [labelsFor]="'conservation'"></app-ol-source-labels>
                  <app-ol-filter-crop2boundary></app-ol-filter-crop2boundary>
                </app-ol-layer-vector>
              }

              <app-ol-layer-vector>
                <app-ol-adaptor-powerlines>
                  <app-ol-style-universal
                    [showAll]="true"></app-ol-style-universal>
                </app-ol-adaptor-powerlines>
                <app-ol-source-geojson
                  [layerKey]="'powerlines'"></app-ol-source-geojson>
                <app-ol-filter-crop2boundary></app-ol-filter-crop2boundary>
              </app-ol-layer-vector>

              <app-ol-layer-vector>
                <!-- 👇 user landmarks here are really map amendments -->
                <app-ol-adaptor-landmarks>
                  <app-ol-style-universal
                    [showAll]="true"></app-ol-style-universal>
                </app-ol-adaptor-landmarks>
                <app-ol-source-landmarks></app-ol-source-landmarks>
              </app-ol-layer-vector>

              @if (sink.zoom >= map.minUsefulZoom()) {
                <app-ol-layer-vector>
                  <app-ol-style-parcels
                    [borderOpacity]="0.33"
                    [labelOpacity]="0.33"
                    [showAbutters]="'never'"
                    [showBorder]="'always'"
                    [showDimensions]="'never'"
                    [showLabels]="'always'"
                    [showSelection]="'always'"></app-ol-style-parcels>
                  <app-ol-source-parcels></app-ol-source-parcels>
                  <app-ol-interaction-selectparcels
                    [findAbutters]="true"></app-ol-interaction-selectparcels>
                </app-ol-layer-vector>
              }
            </app-ol-layers>

            <!-- 🔥 EXPERIMENTAL -->

            <app-ol-layers #right>
              <app-ol-layer-image>
                <app-ol-source-image></app-ol-source-image>
              </app-ol-layer-image>
            </app-ol-layers>

            @if (sink.zoom >= map.minUsefulZoom()) {
              <app-ol-layer-vector>
                <app-ol-style-parcels
                  [borderOpacity]="0.66"
                  [labelOpacity]="0.66"
                  [showAbutters]="'never'"
                  [showBorder]="'always'"
                  [showDimensions]="'never'"
                  [showLabels]="'always'"
                  [showSelection]="'always'"></app-ol-style-parcels>
                <app-ol-source-parcels></app-ol-source-parcels>
                <app-ol-interaction-selectparcels
                  [findAbutters]="true"></app-ol-interaction-selectparcels>
              </app-ol-layer-vector>
            }
          </app-ol-control-splitscreen>

          <!-- 📦 BOUNDARY LAYER -->

          <app-ol-layer-vector>
            <app-ol-adaptor-boundary>
              <app-ol-style-universal
                [showStroke]="true"></app-ol-style-universal>
            </app-ol-adaptor-boundary>
            <app-ol-source-boundary></app-ol-source-boundary>
          </app-ol-layer-vector>

          <!-- 📦 OVERLAY FOR GPS -->

          @if (sink.gps && sink.zoom >= map.minUsefulZoom()) {
            <app-ol-overlay-gps></app-ol-overlay-gps>
          }
        }
      </app-ol-map>
    }
  `
})
export class TopoPage {
  env = environment;

  root = inject(RootPage);
}
