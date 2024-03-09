import { RootPage } from '../root/page';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';

import { environment } from '@lib/environment';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-property',
  template: `
    <app-sink
      #sink
      [gps]="root.gps$ | async"
      [map]="root.map$ | async"
      [satelliteView]="root.satelliteView$ | async"
      [satelliteYear]="root.satelliteYear$ | async"
      [user]="root.user$ | async"
      [zoom]="root.zoom$ | async" />

    @if (sink.map) {
      <app-ol-map
        #olMap
        [bbox]="sink.map.bbox"
        [loadingStrategy]="'all'"
        [minZoom]="13"
        [maxZoom]="22"
        [path]="sink.map.path"
        class="content">
        <!-- 📦 CONTROLS -->

        <app-ol-control-plusminus mapControlZoom></app-ol-control-plusminus>

        <app-ol-control-attribution
          mapControlAttribution></app-ol-control-attribution>

        @if (olMap.initialized) {
          <!-- 📦 OL CONTROLS -->

          <app-ol-control-graticule [step]="0.0025">
            <app-ol-style-graticule></app-ol-style-graticule>
          </app-ol-control-graticule>

          <app-ol-control-scaleline></app-ol-control-scaleline>

          <!-- 📦 TERRAIN LAYERS -->

          @if (!sink.satelliteView) {
            <!-- 📦 HILLSHADE LAYER -->

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

            @if (sink.map.contours2ft) {
              <app-ol-layer-tile>
                <app-ol-source-contours-2ft></app-ol-source-contours-2ft>
              </app-ol-layer-tile>
            }
            @if (!sink.map.contours2ft) {
              <app-ol-layer-tile>
                <app-ol-source-contours></app-ol-source-contours>
              </app-ol-layer-tile>
            }

            <!-- 📦 USER'S LANDMARKS -->

            <app-ol-layer-vector>
              <app-ol-adaptor-landmarks>
                <app-ol-style-universal
                  [showFill]="true"
                  [showStroke]="true"></app-ol-style-universal>
              </app-ol-adaptor-landmarks>
              <app-ol-source-landmarks></app-ol-source-landmarks>
            </app-ol-layer-vector>

            <!-- 📦 NH GranIT VECTOR LAYERS -->

            <app-ol-layer-vector>
              <app-ol-adaptor-wetlands>
                <app-ol-style-universal
                  [showAll]="true"></app-ol-style-universal>
              </app-ol-adaptor-wetlands>
              <app-ol-source-wetlands></app-ol-source-wetlands>
            </app-ol-layer-vector>

            <app-ol-layer-vector>
              <!-- 👇 only drawing labels here - waterbodies draws actual river -->
              <app-ol-adaptor-places>
                <app-ol-style-universal
                  [showText]="true"></app-ol-style-universal>
              </app-ol-adaptor-places>
              <app-ol-source-rivers></app-ol-source-rivers>
            </app-ol-layer-vector>

            <app-ol-layer-vector>
              <app-ol-adaptor-waterbodies>
                <app-ol-style-universal
                  [showAll]="true"></app-ol-style-universal>
              </app-ol-adaptor-waterbodies>
              <!-- 👇 exclude swamp/marsh b/c floodplain source below does it better -->
              <app-ol-source-waterbodies
                [exclude]="[466]"></app-ol-source-waterbodies>
            </app-ol-layer-vector>

            <app-ol-layer-vector>
              <app-ol-adaptor-stonewalls>
                <app-ol-style-universal
                  [showAll]="true"></app-ol-style-universal>
              </app-ol-adaptor-stonewalls>
              <app-ol-source-stonewalls></app-ol-source-stonewalls>
            </app-ol-layer-vector>

            <app-ol-layer-vector>
              <app-ol-adaptor-floodplains>
                <app-ol-style-universal
                  [showAll]="true"></app-ol-style-universal>
              </app-ol-adaptor-floodplains>
              <app-ol-source-floodplains></app-ol-source-floodplains>
            </app-ol-layer-vector>

            <app-ol-layer-vector>
              <app-ol-adaptor-buildings>
                <app-ol-style-universal
                  [showAll]="true"></app-ol-style-universal>
              </app-ol-adaptor-buildings>
              <app-ol-source-geojson
                [layerKey]="'buildings'"></app-ol-source-geojson>
            </app-ol-layer-vector>

            <app-ol-layer-vector>
              <app-ol-adaptor-railroads>
                <app-ol-style-universal
                  [showAll]="true"></app-ol-style-universal>
              </app-ol-adaptor-railroads>
              <app-ol-source-railroads></app-ol-source-railroads>
            </app-ol-layer-vector>

            <app-ol-layer-vector>
              <app-ol-adaptor-roads>
                <app-ol-style-universal
                  [showStroke]="true"></app-ol-style-universal>
              </app-ol-adaptor-roads>
              <app-ol-source-geojson
                [layerKey]="'roads'"></app-ol-source-geojson>
            </app-ol-layer-vector>

            <app-ol-layer-vector>
              <app-ol-adaptor-trails [accentuate]="true">
                <app-ol-style-universal
                  [showAll]="true"></app-ol-style-universal>
              </app-ol-adaptor-trails>
              <app-ol-source-geojson
                [layerKey]="'trails'"></app-ol-source-geojson>
            </app-ol-layer-vector>

            <app-ol-layer-vector>
              <app-ol-adaptor-places>
                <app-ol-style-universal
                  [showText]="true"></app-ol-style-universal>
              </app-ol-adaptor-places>
              <!-- 👇 dams excluded from "places" b/c "dams" below does it better -->
              <app-ol-source-geojson
                [exclude]="['dam', 'park']"
                [layerKey]="'places'"></app-ol-source-geojson>
            </app-ol-layer-vector>

            <app-ol-layer-vector>
              <app-ol-adaptor-places>
                <app-ol-style-universal
                  [showText]="true"></app-ol-style-universal>
              </app-ol-adaptor-places>
              <app-ol-source-dams></app-ol-source-dams>
            </app-ol-layer-vector>

            <app-ol-layer-vector>
              <app-ol-adaptor-powerlines>
                <app-ol-style-universal
                  [showAll]="true"></app-ol-style-universal>
              </app-ol-adaptor-powerlines>
              <app-ol-source-geojson
                [layerKey]="'powerlines'"></app-ol-source-geojson>
            </app-ol-layer-vector>

            <app-ol-layer-vector>
              <app-ol-style-parcels
                [forceSelected]="sink.map.contours2ft"
                [parcelIDs]="sink.map.parcelIDs"
                [showBorder]="'always'"
                [showDimensionContrast]="'never'"
                [showDimensions]="'onlyParcelIDs'"
                [showLabels]="'always'"
                [showLabelContrast]="'never'"
                [showSelection]="
                  sink.map.contours2ft ? 'onlyParcelIDs' : 'never'
                "
                [showStolen]="'always'"></app-ol-style-parcels>
              <app-ol-source-parcels #parcels></app-ol-source-parcels>
            </app-ol-layer-vector>

            <!-- 👇 SEPERATE ROAD NAME LAYER (b/c lot lines overlay road) -->
            <app-ol-layer-vector>
              <app-ol-adaptor-roads>
                <app-ol-style-universal
                  [showText]="true"></app-ol-style-universal>
              </app-ol-adaptor-roads>
              <app-ol-source-geojson
                [layerKey]="'roads'"></app-ol-source-geojson>
              <app-ol-filter-crop2boundary></app-ol-filter-crop2boundary>
            </app-ol-layer-vector>

            <!-- 📦 USER'S LANDMARKS (text, on top of everything else) -->

            <app-ol-layer-vector>
              <app-ol-adaptor-landmarks>
                <app-ol-style-universal
                  [overlaySelectable]="true"
                  [showText]="true"></app-ol-style-universal>
              </app-ol-adaptor-landmarks>
              <app-ol-source-landmarks></app-ol-source-landmarks>
              <app-ol-interaction-selectlandmarks
                [multi]="true"></app-ol-interaction-selectlandmarks>
            </app-ol-layer-vector>
          }

          <!-- 📦 SATELLITE LAYER  -->

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
                    <app-ol-filter-crop2propertyparcels
                      [opacity]="0.33"
                      [parcelIDs]="sink.map.parcelIDs"
                      [source]="parcels"
                      [type]="'mask'"></app-ol-filter-crop2propertyparcels>
                  </app-ol-layer-tile>

                  <app-ol-layer-tile #right>
                    <app-ol-source-satellite
                      [year]="ctx.satelliteYear"></app-ol-source-satellite>
                  </app-ol-layer-tile>
                  <app-ol-filter-crop2propertyparcels
                    [opacity]="0.33"
                    [parcelIDs]="sink.map.parcelIDs"
                    [source]="parcels"
                    [type]="'mask'"></app-ol-filter-crop2propertyparcels>
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
                  <app-ol-filter-crop2propertyparcels
                    [opacity]="0.33"
                    [parcelIDs]="sink.map.parcelIDs"
                    [source]="parcels"
                    [type]="'mask'"></app-ol-filter-crop2propertyparcels>
                </app-ol-layer-tile>
              }

              <app-ol-layer-vector>
                <app-ol-style-parcels
                  [parcelIDs]="sink.map.parcelIDs"
                  [showBorder]="'always'"
                  [showDimensions]="'onlyParcelIDs'"
                  [showDimensionContrast]="'always'"
                  [showLabels]="'always'"
                  [showLabelContrast]="'always'"
                  [showStolen]="'always'"></app-ol-style-parcels>
                <app-ol-source-parcels #parcels></app-ol-source-parcels>
              </app-ol-layer-vector>

              @if (sink.map.contours2ft) {
                <app-ol-layer-tile>
                  <app-ol-source-contours-2ft></app-ol-source-contours-2ft>
                </app-ol-layer-tile>
              }
              @if (!sink.map.contours2ft) {
                <app-ol-layer-tile>
                  <app-ol-source-contours></app-ol-source-contours>
                </app-ol-layer-tile>
              }

              <app-ol-layer-vector>
                <app-ol-adaptor-landmarks>
                  <app-ol-style-universal
                    [contrast]="'normal'"
                    [showAll]="true"></app-ol-style-universal>
                </app-ol-adaptor-landmarks>
                <app-ol-source-landmarks></app-ol-source-landmarks>
                <app-ol-interaction-selectlandmarks
                  [multi]="true"></app-ol-interaction-selectlandmarks>
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
            <app-ol-popup-landmarkproperties></app-ol-popup-landmarkproperties>
          </app-ol-popup-selection>

          <!-- 📦 OVERLAY FOR GPS -->

          @if (sink.gps && sink.zoom >= olMap.minUsefulZoom) {
            <app-ol-overlay-gps></app-ol-overlay-gps>
          }
        }
      </app-ol-map>
    }
  `,
  styleUrls: ['../abstract-map.scss']
})
export class PropertyPage {
  env = environment;

  constructor(public root: RootPage) {}
}
