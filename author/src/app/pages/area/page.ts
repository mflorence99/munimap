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

// 🔥 we only expect "area" maps to be printed, never viewed in the viewer

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DestroyService],
  selector: 'app-area',
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
        [bounds]="sink.mapState.bbox"
        [loadingStrategy]="'bbox'"
        [minZoom]="15"
        [maxZoom]="20"
        [path]="sink.mapState.path">
        <app-controlpanel-properties
          [mapState]="sink.mapState"
          mapControlPanel1></app-controlpanel-properties>

        <app-ol-control-zoom mapControlZoom></app-ol-control-zoom>

        <app-ol-control-print
          [fileName]="sink.mapState.name"
          [printSize]="sink.mapState.printSize"
          mapControlPrint></app-ol-control-print>

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

          <!-- 🔥 TOO OBTRUSIVE ?? <app-ol-control-scalebar *ngIf="map.printing"></app-ol-control-scalebar> -->

          @if (!map.printing) {
            <app-ol-control-scaleline></app-ol-control-scaleline>
          }
          @if (map.printing) {
            <app-ol-control-credits></app-ol-control-credits>
          }

          <!-- 📦 NORMAL (not satellite) LAYERS -->

          @if (!sink.satelliteView) {
            <!-- 📦 BG LAYER (outside town)-->

            @if (map.printing) {
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

            <!-- 📦 BG LAYER (lays down a texture inside town)-->

            <app-ol-layer-vector>
              <app-ol-adaptor-boundary>
                <app-ol-style-universal
                  [showFill]="true"></app-ol-style-universal>
              </app-ol-adaptor-boundary>
              <app-ol-source-boundary></app-ol-source-boundary>
              <app-ol-filter-crop2boundary></app-ol-filter-crop2boundary>
            </app-ol-layer-vector>

            <!-- 📦 HILLSHADE LAYER - limit is 17 but is sometimes n/a -->

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
              <app-ol-filter-colorize
                [operation]="'enhance'"
                [value]="0.33"></app-ol-filter-colorize>
            </app-ol-layer-tile>

            <!-- 📦 NH GranIT VECTOR LAYERS -->

            <app-ol-layer-vector>
              <app-ol-style-parcels
                [showBackground]="'always'"></app-ol-style-parcels>
              <app-ol-source-parcels></app-ol-source-parcels>
            </app-ol-layer-vector>

            <app-ol-layer-vector>
              <app-ol-adaptor-wetlands>
                <app-ol-style-universal
                  [showAll]="true"></app-ol-style-universal>
              </app-ol-adaptor-wetlands>
              <app-ol-source-wetlands></app-ol-source-wetlands>
              <app-ol-filter-crop2boundary></app-ol-filter-crop2boundary>
            </app-ol-layer-vector>

            <app-ol-layer-vector>
              <!-- 👇 only drawing labels here - waterbodies draws actual river -->
              <app-ol-adaptor-places>
                <app-ol-style-universal
                  [showText]="true"></app-ol-style-universal>
              </app-ol-adaptor-places>
              <app-ol-source-rivers></app-ol-source-rivers>
              <app-ol-filter-crop2boundary></app-ol-filter-crop2boundary>
            </app-ol-layer-vector>

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

            <app-ol-layer-vector>
              <app-ol-adaptor-stonewalls>
                <app-ol-style-universal
                  [showAll]="true"></app-ol-style-universal>
              </app-ol-adaptor-stonewalls>
              <app-ol-source-stonewalls></app-ol-source-stonewalls>
              <app-ol-filter-crop2boundary></app-ol-filter-crop2boundary>
            </app-ol-layer-vector>

            <app-ol-layer-vector>
              <app-ol-adaptor-floodplains>
                <app-ol-style-universal
                  [showAll]="true"></app-ol-style-universal>
              </app-ol-adaptor-floodplains>
              <app-ol-source-floodplains></app-ol-source-floodplains>
              <app-ol-filter-crop2boundary></app-ol-filter-crop2boundary>
            </app-ol-layer-vector>

            <app-ol-layer-vector>
              <app-ol-adaptor-buildings>
                <app-ol-style-universal
                  [showAll]="true"></app-ol-style-universal>
              </app-ol-adaptor-buildings>
              <app-ol-source-geojson
                [layerKey]="'buildings'"></app-ol-source-geojson>
              <app-ol-filter-crop2boundary></app-ol-filter-crop2boundary>
            </app-ol-layer-vector>

            <app-ol-layer-vector>
              <app-ol-adaptor-railroads>
                <app-ol-style-universal
                  [showAll]="true"></app-ol-style-universal>
              </app-ol-adaptor-railroads>
              <app-ol-source-railroads></app-ol-source-railroads>
              <app-ol-filter-crop2boundary></app-ol-filter-crop2boundary>
            </app-ol-layer-vector>

            <app-ol-layer-vector>
              <app-ol-adaptor-roads>
                <app-ol-style-universal
                  [showStroke]="true"></app-ol-style-universal>
              </app-ol-adaptor-roads>
              <app-ol-source-geojson
                [layerKey]="'roads'"></app-ol-source-geojson>
              <app-ol-filter-crop2boundary></app-ol-filter-crop2boundary>
            </app-ol-layer-vector>

            <app-ol-layer-vector>
              <app-ol-adaptor-trails>
                <app-ol-style-universal
                  [showAll]="true"></app-ol-style-universal>
              </app-ol-adaptor-trails>
              <app-ol-source-geojson
                [layerKey]="'trails'"></app-ol-source-geojson>
              <app-ol-filter-crop2boundary></app-ol-filter-crop2boundary>
            </app-ol-layer-vector>

            <app-ol-layer-vector>
              <app-ol-adaptor-bridges>
                <app-ol-style-universal
                  [showAll]="true"></app-ol-style-universal>
              </app-ol-adaptor-bridges>
              <app-ol-source-bridges></app-ol-source-bridges>
              <app-ol-filter-crop2boundary></app-ol-filter-crop2boundary>
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
              <app-ol-filter-crop2boundary></app-ol-filter-crop2boundary>
            </app-ol-layer-vector>

            <app-ol-layer-vector>
              <app-ol-adaptor-places>
                <app-ol-style-universal
                  [showText]="true"></app-ol-style-universal>
              </app-ol-adaptor-places>
              <app-ol-source-dams></app-ol-source-dams>
              <app-ol-filter-crop2boundary></app-ol-filter-crop2boundary>
            </app-ol-layer-vector>

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

          <!-- 📦 LOT LINE LAYER (printed) -->

          @if (map.printing) {
            <app-ol-layer-vector>
              <app-ol-style-parcels
                [showBorder]="'always'"
                [showLabels]="'always'"></app-ol-style-parcels>
              <app-ol-source-parcels></app-ol-source-parcels>
            </app-ol-layer-vector>
          }

          <!-- 📦 SELECTION LAYER (not printed) -->

          @if (!map.printing) {
            <app-ol-layer-vector>
              <app-ol-style-parcels
                [showBorder]="'always'"
                [showDimensions]="'whenSelected'"
                [showDimensionContrast]="
                  sink.satelliteView ? 'always' : 'never'
                "
                [showLabels]="'always'"
                [showLabelContrast]="sink.satelliteView ? 'always' : 'never'"
                [showSelection]="'always'"></app-ol-style-parcels>
              <app-ol-source-parcels></app-ol-source-parcels>
              <app-ol-interaction-redrawparcel></app-ol-interaction-redrawparcel>
            </app-ol-layer-vector>
          }

          <!-- 📦 SEPERATE ROAD NAME LAYER (b/c lot lines overlay road) -->

          @if (!sink.satelliteView) {
            <app-ol-layer-vector>
              <app-ol-adaptor-roads>
                <app-ol-style-universal
                  [showText]="true"></app-ol-style-universal>
              </app-ol-adaptor-roads>
              <app-ol-source-geojson
                [layerKey]="'roads'"></app-ol-source-geojson>
              <app-ol-filter-crop2boundary></app-ol-filter-crop2boundary>
            </app-ol-layer-vector>
          }

          <!-- 📦 BOUNDARY LAYER (above selection so we can interact with it) -->

          <app-ol-layer-vector>
            <app-ol-adaptor-boundary>
              <app-ol-style-universal
                [showStroke]="true"></app-ol-style-universal>
            </app-ol-adaptor-boundary>
            <app-ol-source-boundary></app-ol-source-boundary>
          </app-ol-layer-vector>

          <!-- 📦 OVERLAY FOR LABEL REPOSITIONING -->

          @if (!map.printing) {
            <app-ol-overlay-parcellabel></app-ol-overlay-parcellabel>
          }
        }
      </app-ol-map>
    }
  `
})
export class AreaPage extends AbstractMapPage implements OnInit {
  contextMenuHost = viewChild(ContextMenuHostDirective);
  drawer = viewChild(MatDrawer);
  map = viewChild(OLMapComponent);

  getType(): MapType {
    return 'area';
  }

  ngOnInit(): void {
    this.onInit();
  }
}
