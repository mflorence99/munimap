import { RootPage } from "../root/page";

import { ChangeDetectionStrategy } from "@angular/core";
import { Component } from "@angular/core";

import { inject } from "@angular/core";
import { environment } from "@lib/environment";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-property",
  template: `

    @let sink = {
      gps: root.gps$ | async,
      mapState: root.mapState$ | async,
      user: root.user$ | async,
      zoom: root.zoom$ | async
    };

    @if (sink.mapState) {
      <app-ol-map
        #map
        [bounds]="sink.mapState.bbox"
        [loadingStrategy]="'all'"
        [minZoom]="13"
        [maxZoom]="22"
        [path]="sink.mapState.path"
        class="content">

        <!-- ---------------------------------------------------------- -->
        <!-- 🗺️ External control panels                                 -->
        <!-- ---------------------------------------------------------- -->

        <app-ol-control-plusminus mapControlZoom></app-ol-control-plusminus>

        <app-ol-control-attribution
          mapControlAttribution></app-ol-control-attribution>

        @if (map.initialized) {
          
          <!-- ------------------------------------------------------- -->
          <!-- 🗺️ Internal control panels                               -->
          <!-- ------------------------------------------------------- -->

          <app-ol-control-graticule [step]="0.0025">
            <app-ol-style-graticule></app-ol-style-graticule>
          </app-ol-control-graticule>

          <app-ol-control-scaleline></app-ol-control-scaleline>

          <!-- -------------------------------------------------------- -->
          <!-- 🗺️ Normal view                                           -->
          <!-- -------------------------------------------------------- -->

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
            <app-ol-filter-crop2propertyparcels
              [parcelIDs]="sink.mapState.parcelIDs"
              [source]="parcels"
              [type]="'crop'"></app-ol-filter-crop2propertyparcels>
          </app-ol-layer-tile>

          @if (sink.mapState.contours2ft) {
            <app-ol-layer-tile>
              <app-ol-source-contours-2ft></app-ol-source-contours-2ft>
            </app-ol-layer-tile>
          } @else {
            <app-ol-layer-tile>
              <app-ol-source-contours></app-ol-source-contours>
            </app-ol-layer-tile>
          }

          <app-ol-layer-vector>
            <app-ol-adaptor-landmarks>
              <app-ol-style-universal
                [showFill]="true"
                [showStroke]="true"></app-ol-style-universal>
            </app-ol-adaptor-landmarks>
            <app-ol-source-landmarks></app-ol-source-landmarks>
          </app-ol-layer-vector>

          <app-ol-layer-vector>
            <app-ol-adaptor-wetlands>
              <app-ol-style-universal [showAll]="true"></app-ol-style-universal>
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
              <app-ol-style-universal [showAll]="true"></app-ol-style-universal>
            </app-ol-adaptor-waterbodies>
            <!-- 👇 exclude swamp/marsh b/c floodplain source below does it better -->
            <app-ol-source-waterbodies
              [exclude]="[466]"></app-ol-source-waterbodies>
          </app-ol-layer-vector>

          <app-ol-layer-vector>
            <app-ol-adaptor-stonewalls>
              <app-ol-style-universal [showAll]="true"></app-ol-style-universal>
            </app-ol-adaptor-stonewalls>
            <app-ol-source-stonewalls></app-ol-source-stonewalls>
          </app-ol-layer-vector>

          <app-ol-layer-vector>
            <app-ol-adaptor-floodplains>
              <app-ol-style-universal [showAll]="true"></app-ol-style-universal>
            </app-ol-adaptor-floodplains>
            <app-ol-source-floodplains></app-ol-source-floodplains>
          </app-ol-layer-vector>

          <app-ol-layer-vector>
            <app-ol-adaptor-buildings>
              <app-ol-style-universal [showAll]="true"></app-ol-style-universal>
            </app-ol-adaptor-buildings>
            <app-ol-source-geojson
              [layerKey]="'buildings'"></app-ol-source-geojson>
          </app-ol-layer-vector>

          <app-ol-layer-vector>
            <app-ol-adaptor-railroads>
              <app-ol-style-universal [showAll]="true"></app-ol-style-universal>
            </app-ol-adaptor-railroads>
            <app-ol-source-railroads></app-ol-source-railroads>
          </app-ol-layer-vector>

          <app-ol-layer-vector>
            <app-ol-adaptor-roads>
              <app-ol-style-universal
                [showStroke]="true"></app-ol-style-universal>
            </app-ol-adaptor-roads>
            <app-ol-source-geojson [layerKey]="'roads'"></app-ol-source-geojson>
          </app-ol-layer-vector>

          <app-ol-layer-vector>
            <app-ol-adaptor-trails [accentuate]="true">
              <app-ol-style-universal [showAll]="true"></app-ol-style-universal>
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
              <app-ol-style-universal [showAll]="true"></app-ol-style-universal>
            </app-ol-adaptor-powerlines>
            <app-ol-source-geojson
              [layerKey]="'powerlines'"></app-ol-source-geojson>
          </app-ol-layer-vector>

          <app-ol-layer-vector>
            <app-ol-style-parcels
              [forceSelected]="sink.mapState.contours2ft"
              [parcelIDs]="sink.mapState.parcelIDs"
              [showBorder]="'always'"
              [showDimensionContrast]="'never'"
              [showDimensions]="'onlyParcelIDs'"
              [showLabels]="'always'"
              [showLabelContrast]="'never'"
              [showSelection]="
                sink.mapState.contours2ft ? 'onlyParcelIDs' : 'never'
              "
              [showStolen]="'always'"></app-ol-style-parcels>
            <app-ol-source-parcels #parcels></app-ol-source-parcels>
          </app-ol-layer-vector>

          <app-ol-layer-vector>
            <app-ol-adaptor-roads>
              <app-ol-style-universal
                [showText]="true"></app-ol-style-universal>
            </app-ol-adaptor-roads>
            <app-ol-source-geojson [layerKey]="'roads'"></app-ol-source-geojson>
            <app-ol-filter-crop2boundary></app-ol-filter-crop2boundary>
          </app-ol-layer-vector>

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
            <app-ol-popup-landmarkproperties></app-ol-popup-landmarkproperties>
          </app-ol-popup-selection>

          <!-- -------------------------------------------------------- -->
          <!-- 🗺️ GPS popup                                             -->
          <!-- -------------------------------------------------------- -->

          @if (sink.gps && sink.zoom >= map.minUsefulZoom()) {
            <app-ol-overlay-gps></app-ol-overlay-gps>
          }
        }
      </app-ol-map>
    }
  `
})
export class PropertyPage {
  env = environment;

  root = inject(RootPage);
}
