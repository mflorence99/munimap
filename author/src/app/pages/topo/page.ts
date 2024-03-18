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
  selector: 'app-topo',
  template: `
    <app-sink
      #sink
      [map]="root.mapState$ | async"
      [profile]="root.profile$ | async"
      [satelliteView]="root.satelliteView$ | async"
      [user]="root.user$ | async" />

    @if (sink.map) {
      <app-ol-map
        #olMap
        [loadingStrategy]="'bbox'"
        [minZoom]="13"
        [maxZoom]="20"
        [path]="sink.map.path">
        <app-controlpanel-properties
          [map]="sink.map"
          mapControlPanel1></app-controlpanel-properties>

        <app-ol-control-zoom mapControlZoom></app-ol-control-zoom>

        @if (sink.map.name) {
          <app-ol-control-print
            [fileName]="sink.map.name"
            [printSize]="sink.map.printSize"
            mapControlPrint></app-ol-control-print>
        }

        @if (sink.map.name) {
          <app-ol-control-exportlayers
            [fileName]="sink.map.id + '-layers'"
            [layerIDs]="['waterbodies']"
            mapControlExport></app-ol-control-exportlayers>
        }

        <app-ol-control-zoom2extent
          mapControlZoomToExtent></app-ol-control-zoom2extent>

        <app-ol-control-attribution
          mapControlAttribution></app-ol-control-attribution>

        @if (olMap.initialized) {
          <!-- 📦 OL CONTROLS -- WILL BE PRINTED -->

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
          @if (sink.map.name && olMap.printing) {
            <app-ol-control-topolegend
              [county]="sink.map.path.split(':')[1]"
              [id]="sink.map.id"
              [printing]="olMap.printing"
              [state]="sink.map.path.split(':')[0]"
              [title]="sink.map.name"></app-ol-control-topolegend>
          }
          @if (olMap.printing) {
            <app-ol-control-scalebar></app-ol-control-scalebar>
          }
          @if (!olMap.printing) {
            <app-ol-control-scaleline></app-ol-control-scaleline>
          }
          @if (olMap.printing) {
            <app-ol-control-credits></app-ol-control-credits>
          }

          <!-- 📦 NORMAL (not satellite) LAYERS -->

          @if (!sink.satelliteView) {
            <!-- 📦 BG LAYER (outside town)-->

            @if (olMap.printing) {
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

            <app-ol-layer-vector [id]="'waterbodies'">
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
                  [showAll]="true"></app-ol-style-universal>
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
              <app-ol-adaptor-places>
                <app-ol-style-universal
                  [showText]="true"></app-ol-style-universal>
              </app-ol-adaptor-places>
              <app-ol-source-labels
                [dedupe]="true"
                [labelsFor]="'conservation'"></app-ol-source-labels>
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

          <!-- 📦 BOUNDARY LAYER -->

          <app-ol-layer-vector>
            <app-ol-adaptor-boundary>
              <app-ol-style-universal
                [showStroke]="true"></app-ol-style-universal>
            </app-ol-adaptor-boundary>
            <app-ol-source-boundary></app-ol-source-boundary>
          </app-ol-layer-vector>
        }

        <!-- 📦 CONTROLS -->
      </app-ol-map>
    }
  `,
  styleUrls: ['../abstract-map.scss']
})
export class TopoPage extends AbstractMapPage implements OnInit {
  contextMenuHost = viewChild(ContextMenuHostDirective);
  drawer = viewChild(MatDrawer);
  olMap = viewChild(OLMapComponent);

  getType(): MapType {
    return 'topo';
  }

  ngOnInit(): void {
    this.onInit();
  }
}
