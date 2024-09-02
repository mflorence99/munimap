import { ContextMenuComponent } from "../../components/contextmenu";
import { SidebarComponent } from "../../components/sidebar-component";
import { ContextMenuHostDirective } from "../../directives/contextmenu-host";
import { AbstractMapPage } from "../abstract-map";
import { ImportLandmarksComponent } from "./import-landmarks";
import { LandmarkPropertiesComponent } from "./landmark-properties";

import { ChangeDetectionStrategy } from "@angular/core";
import { Component } from "@angular/core";
import { OnInit } from "@angular/core";
import { Type } from "@angular/core";
import { MatDrawer } from "@angular/material/sidenav";
import { Landmark } from "@lib/common";
import { LandmarkPropertiesClass } from "@lib/common";
import { OLInteractionDrawLandmarksComponent } from "@lib/ol/ol-interaction-drawlandmarks";
import { OLInteractionRedrawLandmarkComponent } from "@lib/ol/ol-interaction-redrawlandmark";
import { OLMapComponent } from "@lib/ol/ol-map";
import { OLOverlayLandmarkLabelComponent } from "@lib/ol/ol-overlay-landmarklabel";
import { DestroyService } from "@lib/services/destroy";
import { LandmarksActions } from "@lib/state/landmarks";
import { MapType } from "@lib/state/map";

import { viewChild } from "@angular/core";
import { calculateOrientation } from "@lib/common";
import { bbox } from "@turf/bbox";
import { bboxPolygon } from "@turf/bbox-polygon";
import { lineToPolygon } from "@turf/line-to-polygon";
import { transformRotate } from "@turf/transform-rotate";

import OLFeature from "ol/Feature";

interface LandmarkConversion {
  converter: (feature: OLFeature<any>) => Partial<Landmark>;
  geometryType: "Point" | "LineString" | "Polygon";
  label: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DestroyService],
  selector: "app-property",
  template: `

    @let sink = {
      mapState: root.mapState$ | async,
      profile: root.profile$ | async,
      user: root.user$ | async
    };

    @if (sink.mapState) {
      <mat-drawer-container class="container">
        <mat-drawer-content class="content">
          <app-ol-map
            #map
            [bounds]="sink.mapState.bbox"
            [loadingStrategy]="'all'"
            [minZoom]="13"
            [maxZoom]="22"
            [path]="sink.mapState.path">

            <!-- ---------------------------------------------------------- -->
            <!-- 🗺️ Context menu                                            -->
            <!-- ---------------------------------------------------------- -->

            <app-contextmenu>
              <mat-menu mapContextMenu>
                <ng-template matMenuContent>
                  <ng-template [ngTemplateOutlet]="contextmenu"></ng-template>
                </ng-template>
              </mat-menu>
            </app-contextmenu>

            <!-- ---------------------------------------------------------- -->
            <!-- 🗺️ External control panels                                 -->
            <!-- ---------------------------------------------------------- -->

            <app-controlpanel-properties
              [mapState]="sink.mapState"
              mapControlPanel1></app-controlpanel-properties>

            <app-ol-control-zoom mapControlZoom></app-ol-control-zoom>

            <app-ol-control-print
              [fileName]="sink.mapState.name"
              [printSize]="sink.mapState.printSize"
              mapControlPrint></app-ol-control-print>

            @if (sink.mapState.name) {
              <app-ol-control-exportlandmarks
                [fileName]="sink.mapState.id + '-landmarks'"
                mapControlExport></app-ol-control-exportlandmarks>
            }

            <app-ol-control-zoom2extent
              mapControlZoomToExtent></app-ol-control-zoom2extent>

            <app-ol-control-attribution
              mapControlAttribution></app-ol-control-attribution>

            @if (map.initialized) {
              
              <!-- ------------------------------------------------------- -->
              <!-- 🗺️ Internal control panels                               -->
              <!-- ------------------------------------------------------- -->

              @if (map.printing) {
                <app-ol-control-title
                  [title]="sink.mapState.name"></app-ol-control-title>
              }

              @if (map.printing) {
                <app-ol-control-graticule [step]="0.0025">
                  <app-ol-style-graticule
                    [printing]="true"></app-ol-style-graticule>
                </app-ol-control-graticule>
              }

              @if (!map.printing) {
                <app-ol-control-graticule [step]="0.0025">
                  <app-ol-style-graticule></app-ol-style-graticule>
                </app-ol-control-graticule>
              }

              @if (map.printing) {
                <app-ol-control-scalebar></app-ol-control-scalebar>
              }

              @if (!map.printing) {
                <app-ol-control-scaleline></app-ol-control-scaleline>
              } @else {
                <app-ol-control-credits></app-ol-control-credits>
              }

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
                  [forceSelected]="sink.mapState.contours2ft"
                  [parcelIDs]="sink.mapState.parcelIDs"
                  [showBorder]="'always'"
                  [showDimensions]="'onlyParcelIDs'"
                  [showDimensionContrast]="'never'"
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
                <app-ol-source-geojson
                  [layerKey]="'roads'"></app-ol-source-geojson>
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
                <app-ol-interaction-redrawlandmark></app-ol-interaction-redrawlandmark>
                <app-ol-interaction-drawlandmarks></app-ol-interaction-drawlandmarks>
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
              <!-- 🗺️ Overlay to move landmark                              -->
              <!-- -------------------------------------------------------- -->

              @if (!map.printing) {
                <app-ol-overlay-landmarklabel></app-ol-overlay-landmarklabel>
              }
            }
          </app-ol-map>
        </mat-drawer-content>

        <!-- -------------------------------------------------------- -->
        <!-- 🗺️ Dynamic sidebar                                       -->
        <!-- -------------------------------------------------------- -->

        <mat-drawer #drawer class="sidebar" mode="over" position="end">
          <ng-container appContextMenuHost></ng-container>
        </mat-drawer>
      </mat-drawer-container>
    }

    <!-- -------------------------------------------------------- -->
    <!-- 🗺️ Context menu                                          -->
    <!-- -------------------------------------------------------- -->

    <ng-template #contextmenu>
      <nav class="contextmenu">
        @if (map().selectedIDs.length !== 0) {
          <header class="header">
            <p [ngPlural]="map().selected.length">
              <ng-template ngPluralCase="one">
                {{ map().selected[0].get('name') }}
              </ng-template>
              <ng-template ngPluralCase="other">Multiple landmarks</ng-template>
            </p>
          </header>
        }

        <ul>
          <li
            (click)="
              canImportLandmarks($event) && onContextMenu('import-landmarks')
            "
            [class.disabled]="!canImportLandmarks()"
            class="item">
            <fa-icon
              [fixedWidth]="true"
              [icon]="['far', 'file-import']"></fa-icon>
            <p>Import landmarks from GPX or KML files &hellip;</p>
          </li>

          <li [class.disabled]="!canDrawLandmarks()" class="item">
            <fa-icon [fixedWidth]="true" [icon]="['fas', 'pen']"></fa-icon>
            <p (click)="eatMe($event)">
              Draw new
              <select
                #geometryType
                (input)="
                  canDrawLandmarks($any($event)) &&
                    onContextMenu('draw-landmarks', geometryType.value)
                "
                [disabled]="!canDrawLandmarks()">
                <option [value]="''" selected>-select-</option>
                <option [value]="'Point'">point</option>
                <option [value]="'LineString'">linear</option>
                <option [value]="'Polygon'">area</option>
              </select>
              landmarks
              <em>
                <fa-icon
                  [icon]="['fas', 'question-circle']"
                  matTooltip="Click to place a points, click and drag to draw lines or areas. ESC when finished. Use the redraw tool to modify later."></fa-icon>
              </em>
            </p>
          </li>

          <li
            (click)="
              canLandmarkProperties($any($event)) &&
                onContextMenu('landmark-properties')
            "
            [class.disabled]="!canLandmarkProperties()"
            class="item">
            <fa-icon [fixedWidth]="true" [icon]="['fas', 'tasks']"></fa-icon>
            <p>Modify landmark settings &hellip;</p>
          </li>

          <li [class.disabled]="!canConvertLandmark()" class="item">
            <fa-icon [fixedWidth]="true" [icon]="['fas', 'recycle']"></fa-icon>
            <p (click)="eatMe($event)">
              Convert landmark into
              <select
                #conversionType
                (input)="
                  canConvertLandmark($any($event)) &&
                    onContextMenu('convert-landmark', conversionType.value)
                "
                [disabled]="!canConvertLandmark()">
                <option [value]="''" selected>-select-</option>
                @for (conversion of conversions; track conversion) {
                  @if (canConvertFor(conversion)) {
                    <option [value]="conversion.label">
                      {{ conversion.label }}
                    </option>
                  }
                }
              </select>
            </p>
          </li>

          <li [class.disabled]="!canRenameLandmark()" class="item">
            <fa-icon
              [fixedWidth]="true"
              [icon]="['far', 'file-signature']"></fa-icon>
            <p (click)="eatMe($event)">
              Rename landmark
              <input
                #newName
                (click)="eatMe($event)"
                [disabled]="!canRenameLandmark()"
                [value]="map().selected[0]?.get('name')"
                type="text" />

              <button
                (click)="
                  canRenameLandmark($event) &&
                    onContextMenu('rename-landmark', newName.value)
                "
                mat-icon-button>
                <fa-icon
                  [icon]="['fas', 'check']"
                  [fixedWidth]="true"
                  size="lg"></fa-icon>
              </button>

              <button (click)="newName.value = ''" mat-icon-button>
                <fa-icon
                  [icon]="['fas', 'xmark']"
                  [fixedWidth]="true"
                  size="lg"></fa-icon>
              </button>

              &nbsp;

              <em>
                <fa-icon
                  [icon]="['fas', 'question-circle']"
                  matTooltip="Click the checkmark to save the new name"></fa-icon>
              </em>
            </p>
          </li>

          <li
            (click)="
              canRedrawLandmark($event) && onContextMenu('redraw-landmark')
            "
            [class.disabled]="!canRedrawLandmark()"
            class="item">
            <fa-icon
              [fixedWidth]="true"
              [icon]="['fas', 'draw-polygon']"></fa-icon>
            <p>
              Redraw landmark alignment
              <em>
                <fa-icon
                  [icon]="['fas', 'question-circle']"
                  matTooltip="Click and drag the blue perimeter points. Click+Ctrl to delete a point. ESC when finished."></fa-icon>
              </em>
            </p>
          </li>

          <li
            (click)="canMoveLandmark($event) && onContextMenu('move-landmark')"
            [class.disabled]="!canMoveLandmark()"
            class="item">
            <fa-icon
              [fixedWidth]="true"
              [icon]="['fas', 'crosshairs']"></fa-icon>
            <p>
              Move landmark label
              <em>
                <fa-icon
                  [icon]="['fas', 'question-circle']"
                  matTooltip="Click and drag the target icon to the new position"></fa-icon>
              </em>
            </p>
          </li>

          <li
            (click)="
              canDeleteLandmarks($event) && onContextMenu('delete-landmarks')
            "
            [class.disabled]="!canDeleteLandmarks()"
            class="item">
            <fa-icon [fixedWidth]="true" [icon]="['fas', 'trash']"></fa-icon>
            <p [ngPlural]="map().selected.length">
              <ng-template ngPluralCase="one">Delete landmark</ng-template>
              <ng-template ngPluralCase="other">Delete landmarks</ng-template>
            </p>
          </li>
        </ul>
      </nav>
    </ng-template>
  `,
  styles: [
    `
      button {
        height: 1.5rem;
        width: 1.5rem;
      }

      input {
        height: 1.5rem;
        width: 8rem;
      }

      select {
        appearance: auto;
        background-color: var(--text-color);
        color: var(--background-color);
        display: inline;
        height: 1.5rem;
        width: unset;

        option {
          background-color: var(--mat-gray-800);
          color: var(--text-color);
        }
      }
    `
  ]
})
export class PropertyPage extends AbstractMapPage implements OnInit {
  contextMenu = viewChild(ContextMenuComponent);
  contextMenuHost = viewChild(ContextMenuHostDirective);
  drawLandmarks = viewChild(OLInteractionDrawLandmarksComponent);
  drawer = viewChild(MatDrawer);
  map = viewChild(OLMapComponent);
  moveLandmark = viewChild(OLOverlayLandmarkLabelComponent);
  redrawLandmark = viewChild(OLInteractionRedrawLandmarkComponent);

  // eslint-disable-next-line @typescript-eslint/member-ordering
  conversions: LandmarkConversion[] = [
    {
      converter: this.#convertToArea.bind(this),
      geometryType: "LineString",
      label: "area"
    },
    {
      converter: this.#convertToBuilding.bind(this),
      geometryType: "Polygon",
      label: "building"
    },
    {
      converter: this.#convertToCulvert.bind(this),
      geometryType: "Point",
      label: "culvert"
    },
    {
      converter: this.#convertToDistance.bind(this),
      geometryType: "LineString",
      label: "distance"
    },
    {
      converter: this.#convertToDitch.bind(this),
      geometryType: "LineString",
      label: "ditch"
    },
    {
      converter: this.#convertToDriveway.bind(this),
      geometryType: "LineString",
      label: "driveway"
    },
    {
      converter: this.#convertToField.bind(this),
      geometryType: "Polygon",
      label: "field"
    },
    {
      converter: this.#convertToForest.bind(this),
      geometryType: "Polygon",
      label: "forest"
    },
    {
      converter: this.#convertToImpervious.bind(this),
      geometryType: "Polygon",
      label: "impervious"
    },
    {
      converter: this.#convertToObject.bind(this),
      geometryType: "Point",
      label: "object"
    },
    {
      converter: this.#convertToPlace.bind(this),
      geometryType: "Point",
      label: "place"
    },
    {
      converter: this.#convertToPond.bind(this),
      geometryType: "Polygon",
      label: "pond"
    },
    {
      converter: this.#convertToStonewall.bind(this),
      geometryType: "LineString",
      label: "stonewall"
    },
    {
      converter: this.#convertToStream.bind(this),
      geometryType: "LineString",
      label: "stream"
    },
    {
      converter: this.#convertToTrail.bind(this),
      geometryType: "LineString",
      label: "trail"
    },
    {
      converter: this.#convertToTree.bind(this),
      geometryType: "Point",
      label: "tree"
    },
    {
      converter: this.#convertToWell.bind(this),
      geometryType: "Point",
      label: "well"
    },
    {
      converter: this.#convertToWetland.bind(this),
      geometryType: "Polygon",
      label: "wetland"
    }
  ];

  canConvertFor(conversion: LandmarkConversion): boolean {
    const feature = this.map().selected[0];
    return (
      this.map().selected.length === 1 &&
      conversion.geometryType === feature.getGeometry().getType()
    );
  }

  canConvertLandmark(event?: MouseEvent): boolean {
    return this.#can(event, this.map().selected.length === 1);
  }

  canDeleteLandmarks(event?: MouseEvent): boolean {
    return this.#can(event, this.map().selected.length > 0);
  }

  canDrawLandmarks(event?: MouseEvent): boolean {
    return this.#can(event, true);
  }

  canImportLandmarks(event?: MouseEvent): boolean {
    return this.#can(event, true);
  }

  canLandmarkProperties(event?: MouseEvent): boolean {
    return this.#can(event, this.map().selected.length === 1);
  }

  canMoveLandmark(event?: MouseEvent): boolean {
    const feature = this.map().selected[0];
    return this.#can(
      event,
      this.map().selected.length === 1 &&
        feature.get("name") &&
        ["Point", "Polygon"].includes(feature.getGeometry().getType())
    );
  }

  canRedrawLandmark(event?: MouseEvent): boolean {
    const feature = this.map().selected[0];
    return this.#can(
      event,
      this.map().selected.length === 1 &&
        ["LineString", "Polygon"].includes(feature.getGeometry().getType())
    );
  }

  canRenameLandmark(event?: MouseEvent): boolean {
    return this.#can(event, this.map().selected.length === 1);
  }

  eatMe(event: MouseEvent): void {
    event.stopPropagation();
  }

  getType(): MapType {
    return "property";
  }

  ngOnInit(): void {
    this.onInit();
  }

  onContextMenu(key: string, opaque?: any): void {
    let component: Type<SidebarComponent>;
    switch (key) {
      case "convert-landmark":
        this.#convertTo(opaque);
        break;
      case "delete-landmarks":
        this.store.dispatch(
          this.map().selectedIDs.map(
            (id) => new LandmarksActions.DeleteLandmark({ id })
          )
        );
        break;
      case "draw-landmarks":
        if (opaque) this.drawLandmarks().startDraw(opaque);
        break;
      case "import-landmarks":
        component = ImportLandmarksComponent;
        break;
      case "landmark-properties":
        component = LandmarkPropertiesComponent;
        break;
      case "move-landmark":
        this.moveLandmark().setFeature(this.map().selected[0]);
        break;
      case "redraw-landmark":
        this.redrawLandmark().setFeature(this.map().selected[0]);
        break;
      case "rename-landmark":
        this.#renameTo(opaque);
        break;
    }
    if (component) this.onContextMenuImpl(component);
    // 👇 in some cases, doesn't close itself
    this.contextMenu().closeMenu();
  }

  #can(event: MouseEvent, condition: boolean): boolean {
    if (!condition && event) event.stopPropagation();
    return condition;
  }

  #convertTo(label: string): void {
    if (label) {
      const conversion = this.conversions.find(
        (conversion) => conversion.label === label
      );
      if (conversion) {
        const feature = this.map().selected[0];
        const landmark = conversion.converter(feature);
        this.store.dispatch(new LandmarksActions.UpdateLandmark(landmark));
      }
    }
  }

  // 👇 about zIndex:
  //  0 - background, like forest, field, etc.
  //  1 - lies directly on top of the background like stream, ditch etc
  //  2 - roadways, trails etc cover streams
  //  3 - culverts convey streams under roadways
  //  4 - buildings, ponds etc cover most anything
  //  5 - place names are conceptually on top of everything

  #convertToArea(feature: OLFeature<any>): Partial<Landmark> {
    const formatter = this.getGeoJSONFormatter();
    const geojson = JSON.parse(formatter.writeFeature(feature));
    // 👇 convert geometry to a polygon
    const munged = lineToPolygon(geojson);
    return {
      id: feature.getId() as string,
      geometry: munged.geometry as any /* 👈 types no help here */,
      properties: new LandmarkPropertiesClass({
        fillColor: "--rgb-blue-gray-600",
        fillOpacity: 0.15,
        fontColor: "--rgb-blue-gray-800",
        fontOpacity: 1,
        fontOutline: true,
        fontSize: "medium",
        fontStyle: "normal",
        lineDash: [1, 1],
        name: feature.get("name"),
        showDimension: true,
        strokeColor: "--rgb-blue-gray-800",
        strokeOpacity: 1,
        strokeStyle: "dashed",
        strokeWidth: "medium",
        textRotate: true,
        zIndex: feature.get("zIndex")
      }),
      type: "Feature"
    };
  }

  #convertToBuilding(feature: OLFeature<any>): Partial<Landmark> {
    const formatter = this.getGeoJSONFormatter();
    const geojson = JSON.parse(formatter.writeFeature(feature));
    // 👇 calculate the orientation of the building outline
    const theta = calculateOrientation(geojson);
    // 👇 rotate it level, expand to bbox, then rotate it back
    let munged = transformRotate(geojson, theta * -1);
    munged = bboxPolygon(bbox(munged));
    munged = transformRotate(munged, theta);
    return {
      id: feature.getId() as string,
      geometry: munged.geometry,
      properties: new LandmarkPropertiesClass({
        fillColor: "--map-building-fill",
        fillOpacity: 1,
        fontColor: "--map-building-outline",
        fontOpacity: 1,
        fontOutline: true,
        fontSize: "medium",
        fontStyle: "italic",
        name: "Building",
        orientation: feature.get("orientation"),
        shadowColor: "--map-building-outline",
        shadowOffsetFeet: [2, -2],
        shadowOpacity: 0.75,
        showDimension: false,
        strokeColor: "--map-building-outline",
        strokeOpacity: 1,
        strokePixels: 1,
        strokeStyle: "solid",
        textRotate: true,
        zIndex: 4
      }),
      type: "Feature"
    };
  }

  #convertToCulvert(feature: OLFeature<any>): Partial<Landmark> {
    return {
      id: feature.getId() as string,
      properties: new LandmarkPropertiesClass({
        fontColor: "--rgb-blue-gray-600",
        fontFeet: 16,
        fontOpacity: 1,
        fontOutline: true,
        fontStyle: "normal",
        iconOpacity: 1,
        iconSymbol: "\uf1ce" /* 👈 circle-notch */,
        name: "Culvert",
        textAlign: "center",
        textBaseline: "bottom",
        zIndex: 3
      }),
      type: "Feature"
    };
  }

  #convertToDistance(feature: OLFeature<any>): Partial<Landmark> {
    const formatter = this.getGeoJSONFormatter();
    const geojson = JSON.parse(formatter.writeFeature(feature));
    // 👇 eliminate all but the start and end points
    geojson.geometry.coordinates = [
      geojson.geometry.coordinates[0],
      geojson.geometry.coordinates[geojson.geometry.coordinates.length - 1]
    ];
    return {
      id: feature.getId() as string,
      geometry: geojson.geometry,
      properties: new LandmarkPropertiesClass({
        fontColor: "--rgb-blue-gray-800",
        fontOpacity: 1,
        fontOutline: true,
        fontSize: "small",
        fontStyle: "normal",
        showDimension: true,
        strokeColor: "--rgb-blue-gray-800",
        strokeOpacity: 1,
        strokeStyle: "solid",
        strokeWidth: "thin",
        zIndex: feature.get("zIndex")
      }),
      type: "Feature"
    };
  }

  #convertToDitch(feature: OLFeature<any>): Partial<Landmark> {
    return {
      id: feature.getId() as string,
      properties: new LandmarkPropertiesClass({
        lineDash: [1, 1],
        lineSpline: true,
        strokeColor: "--map-river-line-color",
        strokeOpacity: 1,
        strokeStyle: "dashed",
        strokeWidth: "thin",
        zIndex: 1
      }),
      type: "Feature"
    };
  }

  #convertToDriveway(feature: OLFeature<any>): Partial<Landmark> {
    return {
      id: feature.getId() as string,
      properties: new LandmarkPropertiesClass({
        lineSpline: true,
        strokeColor: "--map-road-lane-VI",
        strokeFeet: 15 /* 👈 feet */,
        strokeOpacity: 1,
        strokeOutline: true,
        strokeOutlineColor: "--map-road-edge-VI",
        strokePattern: "conglomerate",
        strokePatternScale: 0.66,
        strokeStyle: "solid",
        zIndex: 2
      }),
      type: "Feature"
    };
  }

  #convertToField(feature: OLFeature<any>): Partial<Landmark> {
    return {
      id: feature.getId() as string,
      properties: new LandmarkPropertiesClass({
        fillColor: "--map-parcel-fill-u190",
        fillOpacity: 0.25,
        fillPattern: "grass",
        fillPatternAndColor: true,
        fontColor: "--map-conservation-outline",
        fontOpacity: 1,
        fontOutline: true,
        fontSize: "small",
        fontStyle: "normal",
        minWidth: feature.get("minWidth"),
        name: "Field",
        orientation: feature.get("orientation"),
        showDimension: true,
        textLocation: feature.get("textLocation"),
        textRotate: true,
        zIndex: 0
      }),
      type: "Feature"
    };
  }

  #convertToForest(feature: OLFeature<any>): Partial<Landmark> {
    return {
      id: feature.getId() as string,
      properties: new LandmarkPropertiesClass({
        fillColor: "--map-parcel-fill-u501",
        fillOpacity: 0.5,
        fillPattern: "mixtree2",
        fillPatternAndColor: true,
        fontColor: "--map-conservation-outline",
        fontOpacity: 1,
        fontOutline: true,
        fontSize: "small",
        fontStyle: "normal",
        minWidth: feature.get("minWidth"),
        name: "Forest",
        orientation: feature.get("orientation"),
        showDimension: true,
        textLocation: feature.get("textLocation"),
        textRotate: true,
        zIndex: 0
      }),
      type: "Feature"
    };
  }

  #convertToImpervious(feature: OLFeature<any>): Partial<Landmark> {
    return {
      id: feature.getId() as string,
      properties: new LandmarkPropertiesClass({
        fillColor: "--rgb-gray-900",
        fillOpacity: 0.5,
        fillPattern: "conglomerate",
        fillPatternAndColor: true,
        fontColor: "--rgb-gray-900",
        fontOpacity: 1,
        fontOutline: true,
        fontSize: "small",
        fontStyle: "normal",
        minWidth: feature.get("minWidth"),
        name: "Impervious",
        orientation: feature.get("orientation"),
        showDimension: true,
        textLocation: feature.get("textLocation"),
        textRotate: true,
        zIndex: 0
      }),
      type: "Feature"
    };
  }

  #convertToObject(feature: OLFeature<any>): Partial<Landmark> {
    return {
      id: feature.getId() as string,
      properties: new LandmarkPropertiesClass({
        fontColor: "--rgb-brown-700",
        fontFeet: 6,
        fontOpacity: 1,
        fontOutline: true,
        fontStyle: "normal",
        iconOpacity: 1,
        iconOutline: true,
        iconSymbol: "\uf00d" /* 👈 xmark */,
        textAlign: "center",
        textBaseline: "bottom",
        zIndex: 3
      }),
      type: "Feature"
    };
  }

  #convertToPlace(feature: OLFeature<any>): Partial<Landmark> {
    return {
      id: feature.getId() as string,
      properties: new LandmarkPropertiesClass({
        fontColor: "--map-place-text-color",
        fontOpacity: 1,
        fontOutline: true,
        fontSize: "large",
        fontStyle: "italic",
        name: "Place",
        zIndex: 5
      }),
      type: "Feature"
    };
  }

  #convertToPond(feature: OLFeature<any>): Partial<Landmark> {
    return {
      id: feature.getId() as string,
      properties: new LandmarkPropertiesClass({
        fillColor: "--map-waterbody-fill",
        fillOpacity: 1,
        fontColor: "--map-place-water-color",
        fontOpacity: 1,
        fontOutline: true,
        fontSize: "medium",
        fontStyle: "italic",
        minWidth: feature.get("minWidth"),
        name: "Pond",
        orientation: feature.get("orientation"),
        textLocation: feature.get("textLocation"),
        textRotate: true,
        zIndex: 4
      }),
      type: "Feature"
    };
  }

  #convertToStonewall(feature: OLFeature<any>): Partial<Landmark> {
    return {
      id: feature.getId() as string,
      properties: new LandmarkPropertiesClass({
        strokeColor: "--map-stonewall-rocks",
        strokeOpacity: 0.5,
        strokePattern: "rocks",
        strokePatternScale: 2,
        strokeStyle: "solid",
        strokeWidth: "medium",
        zIndex: 4
      }),
      type: "Feature"
    };
  }

  #convertToStream(feature: OLFeature<any>): Partial<Landmark> {
    return {
      id: feature.getId() as string,
      properties: new LandmarkPropertiesClass({
        fontColor: "--map-place-water-color",
        fontOpacity: 1,
        fontOutline: true,
        fontSize: "medium",
        fontStyle: "italic",
        lineChunk: true,
        lineSpline: true,
        name: "Stream",
        strokeColor: "--map-river-line-color",
        strokeOpacity: 1,
        strokeStyle: "solid",
        strokeWidth: "medium",
        zIndex: 1
      }),
      type: "Feature"
    };
  }

  #convertToTrail(feature: OLFeature<any>): Partial<Landmark> {
    return {
      id: feature.getId() as string,
      properties: new LandmarkPropertiesClass({
        fontColor: "--map-trail-text-color",
        fontOpacity: 1,
        fontOutline: true,
        fontSize: "medium",
        fontStyle: "italic",
        lineChunk: true,
        lineDash: [2, 1],
        lineSpline: true,
        name: "Trail",
        strokeColor: "--map-trail-line-color",
        strokeOpacity: 1,
        strokeStyle: "dashed",
        strokeWidth: "medium",
        zIndex: 2
      }),
      type: "Feature"
    };
  }

  #convertToTree(feature: OLFeature<any>): Partial<Landmark> {
    return {
      id: feature.getId() as string,
      properties: new LandmarkPropertiesClass({
        fontColor: "--rgb-green-700",
        fontFeet: 8,
        fontOpacity: 1,
        fontOutline: true,
        fontStyle: "normal",
        iconOpacity: 1,
        iconOutline: true,
        iconSymbol: "\uf1bb" /* 👈 tree */,
        textAlign: "center",
        textBaseline: "bottom",
        zIndex: 3
      }),
      type: "Feature"
    };
  }

  #convertToWell(feature: OLFeature<any>): Partial<Landmark> {
    return {
      id: feature.getId() as string,
      properties: new LandmarkPropertiesClass({
        fontColor: "--rgb-blue-700",
        fontFeet: 6,
        fontOpacity: 1,
        fontOutline: true,
        fontStyle: "normal",
        iconOpacity: 1,
        iconOutline: true,
        iconSymbol: "\uf043" /* 👈 droplet */,
        textAlign: "center",
        textBaseline: "bottom",
        zIndex: 3
      }),
      type: "Feature"
    };
  }

  #convertToWetland(feature: OLFeature<any>): Partial<Landmark> {
    return {
      id: feature.getId() as string,
      properties: new LandmarkPropertiesClass({
        fillColor: "--map-wetland-swamp",
        fillOpacity: 0.25,
        fillPattern: "swamp",
        fontColor: "--map-place-water-color",
        fontOpacity: 1,
        fontOutline: true,
        fontSize: "small",
        fontStyle: "normal",
        minWidth: feature.get("minWidth"),
        name: "Wetland",
        orientation: feature.get("orientation"),
        showDimension: true,
        textLocation: feature.get("textLocation"),
        textRotate: true,
        zIndex: 0
      }),
      type: "Feature"
    };
  }

  #renameTo(name: string): void {
    const feature = this.map().selected[0];
    const landmark: Partial<Landmark> = {
      id: feature.getId() as string,
      properties: {
        name: name
      },
      type: "Feature"
    };
    this.store.dispatch(new LandmarksActions.UpdateLandmark(landmark));
  }
}
