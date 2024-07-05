import { RootPage } from "../root/page";

import { ChangeDetectionStrategy } from "@angular/core";
import { Component } from "@angular/core";
import { HistoricalMap } from "@lib/common";
import { HistoricalsService } from "@lib/services/historicals";

import { inject } from "@angular/core";
import { environment } from "@lib/environment";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-parcels",
  template: `
    <app-sink
      #sink
      [gps]="root.gps$ | async"
      [historicalMapLeft]="root.historicalMapLeft$ | async"
      [historicalMapRight]="root.historicalMapRight$ | async"
      [mapState]="root.map$ | async"
      [parcelCoding]="root.parcelCoding$ | async"
      [satelliteView]="root.satelliteView$ | async"
      [satelliteYear]="root.satelliteYear$ | async"
      [sideBySideView]="root.sideBySideView$ | async"
      [user]="root.user$ | async"
      [zoom]="root.zoom$ | async" />

    @if (sink.mapState) {
      <app-ol-map
        #map
        [bounds]="sink.mapState.bbox"
        [loadingStrategy]="'bbox'"
        [minZoom]="13"
        [maxZoom]="22"
        [path]="sink.mapState.path"
        class="content">
        <!-- ---------------------------------------------------------- -->
        <!-- 🗺️ External control panels                                 -->
        <!-- ---------------------------------------------------------- -->

        @if (sink.zoom >= map.minUsefulZoom()) {
          <app-ol-control-searchparcels
            mapControlSearch></app-ol-control-searchparcels>
        }

        <app-ol-control-plusminus mapControlZoom></app-ol-control-plusminus>

        <app-ol-control-attribution
          mapControlAttribution></app-ol-control-attribution>

        @if (map.initialized) {
          <!-- ------------------------------------------------------- -->
          <!-- 🗺️ Internal control panels                              -->
          <!-- ------------------------------------------------------- -->

          <app-ol-control-graticule>
            <app-ol-style-graticule></app-ol-style-graticule>
          </app-ol-control-graticule>

          <app-ol-control-scaleline></app-ol-control-scaleline>

          <!-- -------------------------------------------------------- -->
          <!-- 🗺️ Outside town                                          -->
          <!-- -------------------------------------------------------- -->

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

          <!-- ------------------------------------------------------- -->
          <!-- 🗺️ Split screen                                         -->
          <!-- ------------------------------------------------------- -->

          <app-ol-control-splitscreen>
            <app-ol-layers #left>
              <!-- -------------------------------------------------------- -->
              <!-- 🗺️ Satellite view                                        -->
              <!-- -------------------------------------------------------- -->

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
                  <app-ol-filter-crop2boundary></app-ol-filter-crop2boundary>
                </app-ol-layer-tile>
              }

              <!-- -------------------------------------------------------- -->
              <!-- 🗺️ Historical view                                       -->
              <!-- -------------------------------------------------------- -->

              @if (!sink.satelliteView && sink.parcelCoding === 'history') {
                @if (
                  findHistoricalMap(sink.mapState.path, sink.historicalMapLeft);
                  as historicalMap
                ) {
                  @if (historicalMap.type === 'image') {
                    <app-ol-layer-image>
                      <app-ol-source-historicalimage
                        [historicalMap]="
                          historicalMap
                        "></app-ol-source-historicalimage>
                    </app-ol-layer-image>
                  }

                  @if (historicalMap.type === 'xyz') {
                    <app-ol-layer-tile>
                      <app-ol-source-historicalxyz
                        [historicalMap]="
                          historicalMap
                        "></app-ol-source-historicalxyz>
                      <app-ol-filter-crop2boundary></app-ol-filter-crop2boundary>
                    </app-ol-layer-tile>
                  }
                }
              }

              <!-- -------------------------------------------------------- -->
              <!-- 🗺️ Normal view                                           -->
              <!-- -------------------------------------------------------- -->

              @if (!sink.satelliteView && sink.parcelCoding !== 'history') {
                <app-ol-layer-vector>
                  <app-ol-adaptor-boundary>
                    <app-ol-style-universal
                      [showFill]="true"></app-ol-style-universal>
                  </app-ol-adaptor-boundary>
                  <app-ol-source-boundary></app-ol-source-boundary>
                  <app-ol-filter-crop2boundary></app-ol-filter-crop2boundary>
                </app-ol-layer-vector>

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
                  <app-ol-filter-crop2boundary></app-ol-filter-crop2boundary>
                  @if (sink.parcelCoding === 'topography') {
                    <app-ol-filter-colorize
                      [color]="'#f8fc03'"
                      [operation]="'color'"
                      [value]="0.25"></app-ol-filter-colorize>
                  } @else {
                    <app-ol-filter-colorize
                      [operation]="'enhance'"
                      [value]="0.33"></app-ol-filter-colorize>
                  }
                </app-ol-layer-tile>

                @if (sink.parcelCoding === 'topography') {
                  <app-ol-layer-tile>
                    <app-ol-source-contours></app-ol-source-contours>
                    <app-ol-filter-crop2boundary></app-ol-filter-crop2boundary>
                  </app-ol-layer-tile>
                }

                @if (sink.parcelCoding === 'topography') {
                  <app-ol-layer-vector>
                    <app-ol-adaptor-conservations>
                      <app-ol-style-universal
                        [showAll]="true"></app-ol-style-universal>
                    </app-ol-adaptor-conservations>
                    <app-ol-source-parcels></app-ol-source-parcels>
                    <app-ol-filter-crop2boundary></app-ol-filter-crop2boundary>
                  </app-ol-layer-vector>
                } @else {
                  <app-ol-layer-vector>
                    <app-ol-style-parcels
                      [showBackground]="'always'"></app-ol-style-parcels>
                    <app-ol-source-parcels></app-ol-source-parcels>
                  </app-ol-layer-vector>
                }

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
                      [showStroke]="true"></app-ol-style-universal>
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

                @if (
                  sink.zoom >= map.minUsefulZoom() &&
                  sink.parcelCoding !== 'topography'
                ) {
                  <app-ol-layer-vector>
                    <app-ol-adaptor-bridges>
                      <app-ol-style-universal
                        [showAll]="true"></app-ol-style-universal>
                    </app-ol-adaptor-bridges>
                    <app-ol-source-bridges></app-ol-source-bridges>
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

                @if (
                  sink.zoom >= map.minUsefulZoom() &&
                  sink.parcelCoding === 'topography'
                ) {
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
            </app-ol-layers>

            <app-ol-layers #right>
              @if (sink.sideBySideView) {
                @if (sink.satelliteView && sink.satelliteYear) {
                  <app-ol-layer-tile>
                    <app-ol-source-satellite
                      [year]="sink.satelliteYear"></app-ol-source-satellite>
                    <app-ol-filter-crop2boundary></app-ol-filter-crop2boundary>
                  </app-ol-layer-tile>
                } @else if (!sink.satelliteView && sink.historicalMapRight) {
                  @if (
                    findHistoricalMap(
                      sink.mapState.path,
                      sink.historicalMapRight
                    );
                    as historicalMap
                  ) {
                    @if (historicalMap.type === 'image') {
                      <app-ol-layer-image>
                        <app-ol-source-historicalimage
                          [historicalMap]="
                            historicalMap
                          "></app-ol-source-historicalimage>
                      </app-ol-layer-image>
                    }

                    @if (historicalMap.type === 'xyz') {
                      <app-ol-layer-tile>
                        <app-ol-source-historicalxyz
                          [historicalMap]="
                            historicalMap
                          "></app-ol-source-historicalxyz>
                        <app-ol-filter-crop2boundary></app-ol-filter-crop2boundary>
                      </app-ol-layer-tile>
                    }
                  }
                }
              }
            </app-ol-layers>
          </app-ol-control-splitscreen>

          <!-- -------------------------------------------------------- -->
          <!-- 🗺️ Lot lines + selection                                 -->
          <!-- -------------------------------------------------------- -->

          @if (sink.zoom >= map.minUsefulZoom()) {
            @if (sink.parcelCoding === 'topography' && !sink.satelliteView) {
              <app-ol-layer-vector>
                <app-ol-style-parcels
                  [borderOpacity]="0.5"
                  [labelOpacity]="0.5"
                  [showAbutters]="'never'"
                  [showBorder]="'always'"
                  [showDimensions]="'never'"
                  [showLabels]="'always'"
                  [showSelection]="'always'"></app-ol-style-parcels>
                <app-ol-source-parcels></app-ol-source-parcels>
                <app-ol-interaction-selectparcels
                  [findAbutters]="false"></app-ol-interaction-selectparcels>
              </app-ol-layer-vector>
            } @else {
              <app-ol-layer-vector>
                <app-ol-style-parcels
                  [showAbutters]="'whenSelected'"
                  [showBorder]="'always'"
                  [showDimensions]="'whenSelected'"
                  [showDimensionContrast]="'always'"
                  [showLabels]="'always'"
                  [showLabelContrast]="sink.satelliteView ? 'always' : 'never'"
                  [showSelection]="'always'"></app-ol-style-parcels>
                <app-ol-source-parcels></app-ol-source-parcels>
                <app-ol-interaction-selectparcels
                  [findAbutters]="true"></app-ol-interaction-selectparcels>
              </app-ol-layer-vector>
            }
          }

          <!-- -------------------------------------------------------- -->
          <!-- 🗺️ Road names (b/c lot lines overlay road)               -->
          <!-- -------------------------------------------------------- -->

          <app-ol-layer-vector>
            <app-ol-adaptor-roads>
              <app-ol-style-universal
                [showText]="true"></app-ol-style-universal>
            </app-ol-adaptor-roads>
            <app-ol-source-geojson [layerKey]="'roads'"></app-ol-source-geojson>
            <app-ol-filter-crop2boundary></app-ol-filter-crop2boundary>
          </app-ol-layer-vector>

          <!-- -------------------------------------------------------- -->
          <!-- 🗺️ Map boundary clips everything                         -->
          <!-- -------------------------------------------------------- -->

          <app-ol-layer-vector>
            <app-ol-adaptor-boundary>
              <app-ol-style-universal
                [showStroke]="true"></app-ol-style-universal>
            </app-ol-adaptor-boundary>
            <app-ol-source-boundary></app-ol-source-boundary>
          </app-ol-layer-vector>

          <!-- -------------------------------------------------------- -->
          <!-- 🗺️ Properties popup                                      -->
          <!-- -------------------------------------------------------- -->

          <app-ol-popup-selection>
            <app-ol-popup-parcelproperties></app-ol-popup-parcelproperties>
          </app-ol-popup-selection>

          <!-- -------------------------------------------------------- -->
          <!-- 🗺️ GPS overlay                                           -->
          <!-- -------------------------------------------------------- -->

          @if (sink.gps && sink.zoom >= map.minUsefulZoom()) {
            <app-ol-overlay-gps></app-ol-overlay-gps>
          }
        }
      </app-ol-map>
    }
  `,
})
export class ParcelsPage {
  env = environment;

  root = inject(RootPage);

  #historicals = inject(HistoricalsService);

  findHistoricalMap(path: string, name: string): HistoricalMap {
    return this.#historicals
      .historicalsFor(path)
      .find((historical) => historical.name === name);
  }
}
