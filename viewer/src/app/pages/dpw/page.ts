import { RootPage } from '../root/page';

import { BehaviorSubject } from 'rxjs';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { FilterFn } from '@lib/ol/ol-source-landmarks';

import { environment } from '@lib/environment';
import { inject } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-dpw',
  template: `
    <app-sink
      #sink
      [gps]="root.gps$ | async"
      [mapState]="root.map$ | async"
      [satelliteView]="root.satelliteView$ | async"
      [satelliteYear]="root.satelliteYear$ | async"
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

          <!-- 📦 NORMAL (not satellite) LAYERS -->

          @if (!sink.satelliteView) {
            <!-- 📦 BG LAYER (outside town)-->

            @if (sink.zoom < map.minUsefulZoom()) {
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
            }

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

            <!-- 📦 NH GranIT VECTOR LAYERS -->

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

            <app-ol-layer-vector>
              <app-ol-adaptor-powerlines>
                <app-ol-style-universal
                  [showAll]="true"></app-ol-style-universal>
              </app-ol-adaptor-powerlines>
              <app-ol-source-geojson
                [layerKey]="'powerlines'"></app-ol-source-geojson>
              <app-ol-filter-crop2boundary></app-ol-filter-crop2boundary>
            </app-ol-layer-vector>

            @if (sink.zoom >= map.minUsefulZoom()) {
              <app-ol-layer-vector>
                <app-ol-style-parcels
                  [borderOpacity]="0.5"
                  [labelOpacity]="0.5"
                  [showBorder]="'always'"
                  [showDimensionContrast]="'never'"
                  [showDimensions]="'never'"
                  [showLabels]="'always'"
                  [showLabelContrast]="'never'"
                  [showSelection]="'never'"
                  [showStolen]="'never'"></app-ol-style-parcels>
                <app-ol-source-parcels></app-ol-source-parcels>
              </app-ol-layer-vector>
            }

            <!-- 📦 STATE'S LANDMARKS -->

            <app-ol-layer-vector #bridges>
              <app-ol-adaptor-bridges [bridgeWidth]="64">
                <app-ol-style-universal
                  [showAll]="true"></app-ol-style-universal>
              </app-ol-adaptor-bridges>
              <app-ol-source-bridges></app-ol-source-bridges>
              <app-ol-filter-crop2boundary></app-ol-filter-crop2boundary>
            </app-ol-layer-vector>

            <app-ol-layer-vector #streamcrossings>
              <app-ol-adaptor-streamcrossings [streamCrossingWidth]="64">
                <app-ol-style-universal
                  [showAll]="true"></app-ol-style-universal>
              </app-ol-adaptor-streamcrossings>
              <app-ol-source-streamcrossings></app-ol-source-streamcrossings>
              <app-ol-filter-crop2boundary></app-ol-filter-crop2boundary>
            </app-ol-layer-vector>

            <app-ol-layer-vector #floodhazards>
              <app-ol-adaptor-floodhazards [floodHazardWidth]="64">
                <app-ol-style-universal
                  [showAll]="true"></app-ol-style-universal>
              </app-ol-adaptor-floodhazards>
              <app-ol-source-floodhazards></app-ol-source-floodhazards>
              <app-ol-filter-crop2boundary></app-ol-filter-crop2boundary>
            </app-ol-layer-vector>

            <!-- 📦 DPW'S LANDMARKS -->

            <app-ol-layer-vector #landmarks>
              <app-ol-adaptor-dpwlandmarks [dpwLandmarkWidth]="64">
                <app-ol-style-universal
                  [showAll]="true"></app-ol-style-universal>
              </app-ol-adaptor-dpwlandmarks>
              <app-ol-source-landmarks
                [filterFn$]="filterFn$"></app-ol-source-landmarks>
              <app-ol-interaction-selectlandmarks
                [layers]="[bridges, streamcrossings, floodhazards, landmarks]"
                [multi]="false"></app-ol-interaction-selectlandmarks>
            </app-ol-layer-vector>
          }

          <!-- 📦 SATELLITE LAYERS  -->

          @if (sink.satelliteView) {
            @if ({ satelliteYear: sink.satelliteYear }; as ctx) {
              <!-- 👇 split screen if year selected  -->

              @if (ctx.satelliteYear) {
                <app-ol-control-splitscreen>
                  <app-ol-layer-tile #left>
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

                  <app-ol-layer-tile #right>
                    <app-ol-source-satellite
                      [year]="ctx.satelliteYear"></app-ol-source-satellite>
                  </app-ol-layer-tile>
                </app-ol-control-splitscreen>
              }

              <!-- 👇 otherwise, just show latest  -->

              @if (!ctx.satelliteYear) {
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

              <app-ol-layer-vector>
                <app-ol-style-parcels
                  [borderOpacity]="0.5"
                  [labelOpacity]="0.5"
                  [showBorder]="'always'"
                  [showDimensionContrast]="'never'"
                  [showDimensions]="'never'"
                  [showLabels]="'always'"
                  [showLabelContrast]="'always'"
                  [showSelection]="'never'"
                  [showStolen]="'never'"></app-ol-style-parcels>
                <app-ol-source-parcels></app-ol-source-parcels>
              </app-ol-layer-vector>

              <app-ol-layer-vector #bridges>
                <app-ol-adaptor-bridges [bridgeWidth]="64">
                  <app-ol-style-universal
                    [contrast]="'whiteOnBlack'"
                    [showAll]="true"></app-ol-style-universal>
                </app-ol-adaptor-bridges>
                <app-ol-source-bridges></app-ol-source-bridges>
                <app-ol-filter-crop2boundary></app-ol-filter-crop2boundary>
              </app-ol-layer-vector>

              <app-ol-layer-vector #streamcrossings>
                <app-ol-adaptor-streamcrossings [streamCrossingWidth]="64">
                  <app-ol-style-universal
                    [contrast]="'whiteOnBlack'"
                    [showAll]="true"></app-ol-style-universal>
                </app-ol-adaptor-streamcrossings>
                <app-ol-source-streamcrossings></app-ol-source-streamcrossings>
                <app-ol-filter-crop2boundary></app-ol-filter-crop2boundary>
              </app-ol-layer-vector>

              <app-ol-layer-vector #floodhazards>
                <app-ol-adaptor-floodhazards [floodHazardWidth]="64">
                  <app-ol-style-universal
                    [contrast]="'whiteOnBlack'"
                    [showAll]="true"></app-ol-style-universal>
                </app-ol-adaptor-floodhazards>
                <app-ol-source-floodhazards></app-ol-source-floodhazards>
                <app-ol-filter-crop2boundary></app-ol-filter-crop2boundary>
              </app-ol-layer-vector>

              <app-ol-layer-vector #landmarks>
                <app-ol-adaptor-dpwlandmarks [dpwLandmarkWidth]="64">
                  <app-ol-style-universal
                    [contrast]="'whiteOnBlack'"
                    [showAll]="true"></app-ol-style-universal>
                </app-ol-adaptor-dpwlandmarks>
                <app-ol-source-landmarks
                  [filterFn$]="filterFn$"></app-ol-source-landmarks>
                <app-ol-interaction-selectlandmarks
                  [layers]="[bridges, streamcrossings, floodhazards, landmarks]"
                  [multi]="false"></app-ol-interaction-selectlandmarks>
              </app-ol-layer-vector>
            }
          }

          <!-- 📦 BOUNDARY LAYER -->

          <app-ol-layer-vector>
            <app-ol-adaptor-boundary>
              <app-ol-style-universal
                [showStroke]="true"></app-ol-style-universal>
            </app-ol-adaptor-boundary>
            <app-ol-source-boundary></app-ol-source-boundary>
          </app-ol-layer-vector>

          <!-- 📦 POPUP FOR PROPERTIES -->

          <app-ol-popup-selection>
            <app-ol-popup-dpwproperties></app-ol-popup-dpwproperties>
          </app-ol-popup-selection>

          <!-- 📦 OVERLAY FOR GPS -->

          @if (sink.gps && sink.zoom >= map.minUsefulZoom()) {
            <app-ol-overlay-gps></app-ol-overlay-gps>
          }
        }
      </app-ol-map>
    }
  `,
  styleUrls: ['../abstract-map.scss']
})
export class DPWPage {
  env = environment;
  filterFn$ = new BehaviorSubject<FilterFn>(() => true);

  root = inject(RootPage);
}
