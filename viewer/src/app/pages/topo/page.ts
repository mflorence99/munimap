import { AbstractMapPage } from '../abstract-map';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Map } from '@lib/state/map';
import { MapState } from '@lib/state/map';
import { Observable } from 'rxjs';
import { OnInit } from '@angular/core';
import { Select } from '@ngxs/store';
import { ViewState } from '@lib/state/view';
import { ViewStateModel } from '@lib/state/view';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-topo',
  template: `
    @if (map$ | async; as map) {
      <app-ol-map
        #olMap
        [loadingStrategy]="'bbox'"
        [minZoom]="13"
        [maxZoom]="20"
        [path]="map.path"
        class="content">
        <!-- 📦 CONTROLS -->

        <app-ol-control-plusminus mapControlZoom></app-ol-control-plusminus>

        <app-ol-control-attribution
          mapControlAttribution></app-ol-control-attribution>

        @if (olMap.initialized) {
          <!-- 📦 OL CONTROLS -->

          <app-ol-control-graticule>
            <app-ol-style-graticule></app-ol-style-graticule>
          </app-ol-control-graticule>

          <app-ol-control-scaleline></app-ol-control-scaleline>

          <!-- 📦 NORMAL (not satellite) LAYERS -->

          @if (!(satelliteView$ | async)) {
            <!-- 📦 BG LAYER (outside town)-->

            @if ((zoom$ | async) < olMap.minUsefulZoom) {
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

            @if ((zoom$ | async) >= olMap.minUsefulZoom) {
              <app-ol-layer-vector>
                <app-ol-adaptor-wetlands>
                  <app-ol-style-universal
                    [showAll]="true"></app-ol-style-universal>
                </app-ol-adaptor-wetlands>
                <app-ol-source-wetlands></app-ol-source-wetlands>
                <app-ol-filter-crop2boundary></app-ol-filter-crop2boundary>
              </app-ol-layer-vector>
            }
            @if ((zoom$ | async) >= olMap.minUsefulZoom) {
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

            @if ((zoom$ | async) >= olMap.minUsefulZoom) {
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

            @if ((zoom$ | async) >= olMap.minUsefulZoom) {
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
            @if ((zoom$ | async) >= olMap.minUsefulZoom) {
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

            @if ((zoom$ | async) >= olMap.minUsefulZoom) {
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
            @if ((zoom$ | async) >= olMap.minUsefulZoom) {
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
            @if ((zoom$ | async) >= olMap.minUsefulZoom) {
              <app-ol-layer-vector>
                <app-ol-adaptor-places>
                  <app-ol-style-universal
                    [showText]="true"></app-ol-style-universal>
                </app-ol-adaptor-places>
                <app-ol-source-dams></app-ol-source-dams>
                <app-ol-filter-crop2boundary></app-ol-filter-crop2boundary>
              </app-ol-layer-vector>
            }
            @if ((zoom$ | async) >= olMap.minUsefulZoom) {
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
          }

          <!-- 📦 SATELLITE LAYERS  -->

          @if (satelliteView$ | async) {
            @if ({ satelliteYear: satelliteYear$ | async }; as ctx) {
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

          <!-- 📦 OVERLAY FOR GPS -->

          @if ((gps$ | async) && (zoom$ | async) >= olMap.minUsefulZoom) {
            <app-ol-overlay-gps></app-ol-overlay-gps>
          }
        }
      </app-ol-map>
    }
  `,
  styleUrls: ['../abstract-map.scss']
})
export class TopoPage extends AbstractMapPage implements OnInit {
  @Select(ViewState.gps) gps$: Observable<boolean>;

  @Select(MapState) map$: Observable<Map>;

  @Select(ViewState.satelliteView) satelliteView$: Observable<boolean>;

  @Select(ViewState.satelliteYear) satelliteYear$: Observable<string>;

  @Select(ViewState) view$: Observable<ViewStateModel>;

  ngOnInit(): void {
    this.onInit();
  }
}
