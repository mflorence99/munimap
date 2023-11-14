import { AbstractMapPage } from '../abstract-map';
import { AddParcelComponent } from './add-parcel';
import { ContextMenuHostDirective } from '../../directives/contextmenu-host';
import { CreatePropertyMapComponent } from './create-propertymap';
import { MergeParcelsComponent } from './merge-parcels';
import { ParcelPropertiesComponent } from './parcel-properties';
import { RootPage } from '../root/page';
import { SidebarComponent } from '../../components/sidebar-component';
import { SubdivideParcelComponent } from './subdivide-parcel';

import { Actions } from '@ngxs/store';
import { ActivatedRoute } from '@angular/router';
import { AddParcels } from '@lib/state/parcels';
import { AuthState } from '@lib/state/auth';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { DestroyService } from '@lib/services/destroy';
import { Map } from '@lib/state/map';
import { MapState } from '@lib/state/map';
import { MapType } from '@lib/state/map';
import { MatDrawer } from '@angular/material/sidenav';
import { Observable } from 'rxjs';
import { OLInteractionRedrawParcelComponent } from '@lib/ol/parcels/ol-interaction-redrawparcel';
import { OLMapComponent } from '@lib/ol/ol-map';
import { OLOverlayParcelLabelComponent } from '@lib/ol/parcels/ol-overlay-parcellabel';
import { OnInit } from '@angular/core';
import { Parcel } from '@lib/common';
import { ParcelPropertiesLabel } from '@lib/common';
import { Router } from '@angular/router';
import { Select } from '@ngxs/store';
import { Store } from '@ngxs/store';
import { Type } from '@angular/core';
import { ViewChild } from '@angular/core';
import { ViewState } from '@lib/state/view';

import { calculateParcel } from '@lib/common';
import { fromLonLat } from 'ol/proj';
import { point } from '@turf/helpers';
import { polygon } from '@turf/helpers';
import { toLonLat } from 'ol/proj';

import bbox from '@turf/bbox';
import bboxPolygon from '@turf/bbox-polygon';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import circle from '@turf/circle';
import OLFeature from 'ol/Feature';
import OLGeoJSON from 'ol/format/GeoJSON';
import OLMultiPolygon from 'ol/geom/MultiPolygon';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DestroyService],
  selector: 'app-parcels',
  template: `
    @if (mapState$ | async; as map) {
      <mat-drawer-container class="container">
        <mat-drawer-content class="content">
          <app-ol-map
            #olMap
            [loadingStrategy]="'bbox'"
            [minZoom]="15"
            [maxZoom]="22"
            [path]="map.path">
            <app-contextmenu>
              <mat-menu mapContextMenu>
                <ng-template matMenuContent>
                  <ng-template [ngTemplateOutlet]="contextmenu"></ng-template>
                </ng-template>
              </mat-menu>
            </app-contextmenu>

            <app-controlpanel-properties
              [map]="map"
              class="setup"
              mapControlPanel1></app-controlpanel-properties>

            <!-- 📦 CONTROLS -->

            <app-ol-control-searchparcels
              mapControlSearch></app-ol-control-searchparcels>

            <app-ol-control-zoom mapControlZoom></app-ol-control-zoom>

            @if (map.name) {
              <app-ol-control-print
                [fileName]="map.name"
                [printSize]="map.printSize"
                mapControlPrint></app-ol-control-print>
            }
            @if (map.name) {
              <app-ol-control-exportparcels
                [fileName]="map.id + '-parcels'"
                mapControlExport></app-ol-control-exportparcels>
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
              @if (map.name && olMap.printing) {
                <app-ol-control-parcelslegend
                  [county]="map.path.split(':')[1]"
                  [id]="map.id"
                  [printing]="olMap.printing"
                  [state]="map.path.split(':')[0]"
                  [title]="map.name"></app-ol-control-parcelslegend>
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

              @if (!(satelliteView$ | async)) {
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
                    [showBackground]="'always'"
                    [showStolen]="
                      isPrivileged() && !olMap.printing ? 'always' : 'never'
                    "></app-ol-style-parcels>
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

              @if (satelliteView$ | async) {
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

              @if (olMap.printing) {
                <app-ol-layer-vector>
                  <app-ol-style-parcels
                    [showBorder]="'always'"
                    [showLabels]="'always'"
                    [showStolen]="
                      isPrivileged() && !olMap.printing ? 'always' : 'never'
                    "></app-ol-style-parcels>
                  <app-ol-source-parcels></app-ol-source-parcels>
                </app-ol-layer-vector>
              }

              <!-- 📦 SELECTION LAYER (not printed) -->

              @if (!olMap.printing) {
                <app-ol-layer-vector>
                  <app-ol-style-parcels
                    [showBorder]="'always'"
                    [showDimensions]="'whenSelected'"
                    [showDimensionContrast]="
                      (satelliteView$ | async) ? 'always' : 'never'
                    "
                    [showLabels]="'always'"
                    [showLabelContrast]="
                      (satelliteView$ | async) ? 'always' : 'never'
                    "
                    [showSelection]="'always'"
                    [showStolen]="
                      isPrivileged() && !olMap.printing ? 'always' : 'never'
                    "></app-ol-style-parcels>
                  <app-ol-source-parcels></app-ol-source-parcels>
                  <app-ol-interaction-selectparcels></app-ol-interaction-selectparcels>
                  <app-ol-interaction-redrawparcel></app-ol-interaction-redrawparcel>
                </app-ol-layer-vector>
              }

              <!-- 📦 SEPERATE ROAD NAME LAYER (b/c lot lines overlay road) -->

              @if (!(satelliteView$ | async)) {
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
                @if (isPrivileged()) {
                  <app-ol-interaction-redrawboundary></app-ol-interaction-redrawboundary>
                }
              </app-ol-layer-vector>

              <!-- 📦 OVERLAY FOR LABEL REPOSITIONING -->

              @if (!olMap.printing) {
                <app-ol-overlay-parcellabel></app-ol-overlay-parcellabel>
              }
            }
          </app-ol-map>
        </mat-drawer-content>

        <!-- 📦 DYNAMIC SIDEBAR-->

        <mat-drawer #drawer class="sidebar" mode="over" position="end">
          <ng-container appContextMenuHost></ng-container>
        </mat-drawer>
      </mat-drawer-container>
    }

    <!-- 📦 CONTEXT MENU -->

    <ng-template #contextmenu>
      <nav class="contextmenu">
        @if (olMap.selectedIDs.length !== 0) {
          <header class="header">
            Parcels {{ olMap.selectedIDs.join(', ') }}
          </header>
        }

        <ul>
          <li
            (click)="
              canParcelProperties($event) && onContextMenu('parcel-properties')
            "
            [class.disabled]="!canParcelProperties()"
            class="item">
            <fa-icon [fixedWidth]="true" [icon]="['fas', 'tasks']"></fa-icon>
            <p>Modify parcel settings &hellip;</p>
          </li>

          <li
            (click)="canAddParcel($event) && onContextMenu('add-parcel')"
            [class.disabled]="!canAddParcel()"
            class="item">
            <fa-icon
              [fixedWidth]="true"
              [icon]="['fas', 'plus-square']"></fa-icon>
            <p>New parcel &hellip;</p>
          </li>

          <li
            (click)="
              canSubdivideParcel($event) && onContextMenu('subdivide-parcel')
            "
            [class.disabled]="!canSubdivideParcel()"
            class="item">
            <fa-icon
              [fixedWidth]="true"
              [icon]="['fas', 'object-ungroup']"></fa-icon>
            <p>Subdivide parcel &hellip;</p>
          </li>

          <li
            (click)="
              canRedrawBoundary($event) && onContextMenu('redraw-boundary')
            "
            [class.disabled]="!canRedrawBoundary()"
            class="item">
            <fa-icon
              [fixedWidth]="true"
              [icon]="['fas', 'draw-polygon']"></fa-icon>
            <p>
              Redraw parcel boundary
              <em>
                <fa-icon
                  [icon]="['fas', 'question-circle']"
                  matTooltip="Click and drag the blue perimeter points. Click+Ctrl to delete a point. ESC when finished."></fa-icon>
              </em>
            </p>
          </li>

          <li
            (click)="canMergeParcels($event) && onContextMenu('merge-parcels')"
            [class.disabled]="!canMergeParcels()"
            class="item">
            <fa-icon
              [fixedWidth]="true"
              [icon]="['fas', 'object-group']"></fa-icon>
            <p>Merge parcels &hellip;</p>
          </li>

          <li
            (click)="
              canRecenterLabel($event) && onContextMenu('recenter-label')
            "
            [class.disabled]="!canRecenterLabel()"
            class="item">
            <fa-icon
              [fixedWidth]="true"
              [icon]="['fas', 'crosshairs']"></fa-icon>
            <p>
              Recenter label in parcel
              <em>
                <fa-icon
                  [icon]="['fas', 'question-circle']"
                  matTooltip="Click and drag the target icon to the new label position"></fa-icon>
              </em>
            </p>
          </li>

          @if (isPrivileged()) {
            <hr />

            <li
              (click)="canAddPolygon($event) && onContextMenu('add-polygon')"
              [class.disabled]="!canAddPolygon()"
              class="item">
              <fa-icon [fixedWidth]="true" [icon]="['fas', 'plus']"></fa-icon>
              <p>New parcel polygon</p>
            </li>

            <li
              (click)="
                canDeletePolygon($event) && onContextMenu('delete-polygon')
              "
              [class.disabled]="!canDeletePolygon()"
              class="item">
              <fa-icon [fixedWidth]="true" [icon]="['fas', 'trash']"></fa-icon>
              <p>Remove parcel polygon</p>
            </li>

            <li
              (click)="canSplitLabel($event) && onContextMenu('split-label')"
              [class.disabled]="!canSplitLabel()"
              class="item">
              <fa-icon [fixedWidth]="true" [icon]="['fas', 'split']"></fa-icon>
              <p>Split/unsplit label</p>
            </li>

            <li
              (click)="canRotateLabel($event) && onContextMenu('rotate-label')"
              [class.disabled]="!canRotateLabel()"
              class="item">
              <fa-icon [fixedWidth]="true" [icon]="['fas', 'rotate']"></fa-icon>
              <p>Rotate/unrotate label</p>
            </li>

            <li
              (click)="
                canCreatePropertyMap($event) &&
                  onContextMenu('create-propertymap')
              "
              [class.disabled]="!canCreatePropertyMap()"
              class="item">
              <fa-icon
                [fixedWidth]="true"
                [icon]="['fas', 'location-plus']"></fa-icon>
              <p>Create property map &hellip;</p>
            </li>
          }
        </ul>
      </nav>
    </ng-template>
  `,
  styleUrls: ['../abstract-map.scss']
})
export class ParcelsPage extends AbstractMapPage implements OnInit {
  @ViewChild(ContextMenuHostDirective)
  contextMenuHost: ContextMenuHostDirective;

  @ViewChild('drawer') drawer: MatDrawer;

  @ViewChild(OLInteractionRedrawParcelComponent)
  interactionRedraw: OLInteractionRedrawParcelComponent;

  @Select(MapState) mapState$: Observable<Map>;

  @ViewChild(OLMapComponent) olMap: OLMapComponent;

  @ViewChild(OLOverlayParcelLabelComponent)
  overlayLabel: OLOverlayParcelLabelComponent;

  @Select(ViewState.satelliteView) satelliteView$: Observable<boolean>;

  constructor(
    protected override actions$: Actions,
    protected override authState: AuthState,
    protected override destroy$: DestroyService,
    protected override root: RootPage,
    protected override route: ActivatedRoute,
    protected override router: Router,
    protected override store: Store,
    protected override viewState: ViewState
  ) {
    super(actions$, authState, destroy$, root, route, router, store, viewState);
  }

  canAddParcel(event?: MouseEvent): boolean {
    return this.#can(event, this.olMap.selectedIDs.length === 0);
  }

  canAddPolygon(event?: MouseEvent): boolean {
    return this.#can(event, this.olMap.selectedIDs.length === 1);
  }

  canCreatePropertyMap(event?: MouseEvent): boolean {
    return this.#can(event, this.olMap.selectedIDs.length >= 1);
  }

  canDeletePolygon(event?: MouseEvent): boolean {
    return this.#can(
      event,
      this.olMap.selectedIDs.length === 1 &&
        this.olMap.selected[0].getGeometry().getType() === 'MultiPolygon'
    );
  }

  canMergeParcels(event?: MouseEvent): boolean {
    return this.#can(event, this.olMap.selectedIDs.length > 1);
  }

  canParcelProperties(event?: MouseEvent): boolean {
    return this.#can(event, this.olMap.selectedIDs.length > 0);
  }

  canRecenterLabel(event?: MouseEvent): boolean {
    return this.#can(event, this.olMap.selectedIDs.length === 1);
  }

  canRedrawBoundary(event?: MouseEvent): boolean {
    return this.#can(event, this.olMap.selectedIDs.length === 1);
  }

  canRotateLabel(event?: MouseEvent): boolean {
    return this.#can(event, this.olMap.selectedIDs.length === 1);
  }

  canSplitLabel(event?: MouseEvent): boolean {
    return this.#can(event, this.olMap.selectedIDs.length === 1);
  }

  canSubdivideParcel(event?: MouseEvent): boolean {
    return this.#can(event, this.olMap.selectedIDs.length === 1);
  }

  getType(): MapType {
    return 'parcels';
  }

  ngOnInit(): void {
    this.onInit();
  }

  onContextMenu(key: string): void {
    let component: Type<SidebarComponent>;
    switch (key) {
      case 'add-parcel':
        component = AddParcelComponent;
        break;
      case 'add-polygon':
        this.#addPolygon(this.olMap.selected[0]);
        break;
      case 'create-propertymap':
        component = CreatePropertyMapComponent;
        break;
      case 'delete-polygon':
        this.#deletePolygon(this.olMap.selected[0]);
        break;
      case 'parcel-properties':
        component = ParcelPropertiesComponent;
        break;
      case 'merge-parcels':
        component = MergeParcelsComponent;
        break;
      case 'recenter-label':
        this.overlayLabel.setFeature(this.olMap.selected[0]);
        break;
      case 'redraw-boundary':
        this.interactionRedraw.setFeature(this.olMap.selected[0]);
        break;
      case 'rotate-label':
        this.#rotateLabel(this.olMap.selected[0]);
        break;
      case 'split-label':
        this.#splitLabel(this.olMap.selected[0]);
        break;
      case 'subdivide-parcel':
        component = SubdivideParcelComponent;
        break;
    }
    if (component) this.onContextMenuImpl(component);
  }

  #addPolygon(feature: OLFeature<any>): void {
    if (feature.getGeometry().getType() === 'Polygon')
      feature.setGeometry(
        new OLMultiPolygon([feature.getGeometry().getCoordinates()])
      );
    // 👇 create a square centered on the context menu
    const polygon = bboxPolygon(
      bbox(
        circle(toLonLat(this.olMap.contextMenuAt), 100, {
          steps: 16,
          units: 'feet'
        })
      )
    );
    // 👇 add the new polygon to the feature
    const coords = feature.getGeometry().getCoordinates();
    coords.push([
      polygon.geometry.coordinates[0].map((coord: any) => fromLonLat(coord))
    ]);
    feature.getGeometry().setCoordinates(coords);
    this.#modifyFeature(feature, true, false);
  }

  #can(event: MouseEvent, condition: boolean): boolean {
    if (!condition && event) event.stopPropagation();
    return condition;
  }

  #deletePolygon(feature: OLFeature<any>): void {
    const coords = feature.getGeometry().getCoordinates();
    coords.splice(this.#whichPolygon(feature), 1);
    feature.getGeometry().setCoordinates(coords);
    this.#modifyFeature(feature, true, false);
  }

  #modifyFeature(
    feature: OLFeature<any>,
    doGeometry = false,
    doProperties = false
  ): void {
    const format = new OLGeoJSON({
      dataProjection: this.olMap.featureProjection,
      featureProjection: this.olMap.projection
    });
    // 👉 convert to feature to geojson and recalculate centers etc
    const parcel = JSON.parse(format.writeFeature(feature));
    calculateParcel(parcel);
    feature.setProperties(parcel.properties);
    // 👉 record the modification
    const redrawnParcel: Parcel = {
      action: 'modified',
      geometry: doGeometry ? parcel.geometry : null,
      id: feature.getId(),
      owner: this.authState.currentProfile().email,
      path: this.olMap.path,
      properties: doProperties ? parcel.properties : null,
      type: 'Feature'
    };
    this.store.dispatch(new AddParcels([redrawnParcel]));
  }

  #rotateLabel(feature: OLFeature<any>): void {
    const ix = this.#whichPolygon(feature);
    const labels: ParcelPropertiesLabel[] =
      feature.getProperties().labels ?? [];
    const label: ParcelPropertiesLabel = labels[ix] ?? {
      split: null,
      rotate: null
    };
    label.rotate = label.rotate ? false : true;
    labels[ix] = label;
    feature.setProperties({ labels });
    this.#modifyFeature(feature, false, true);
  }

  #splitLabel(feature: OLFeature<any>): void {
    const ix = this.#whichPolygon(feature);
    const labels: ParcelPropertiesLabel[] =
      feature.getProperties().labels ?? [];
    const label: ParcelPropertiesLabel = labels[ix] ?? {
      split: null,
      rotate: null
    };
    label.split = label.split ? null : true;
    labels[ix] = label;
    feature.setProperties({ labels });
    this.#modifyFeature(feature, false, true);
  }

  #whichPolygon(feature: OLFeature<any>): number {
    let ix = 0;
    if (feature.getGeometry().getType() === 'MultiPolygon') {
      const polygons = feature.getGeometry().getPolygons();
      for (ix = 0; ix < polygons.length; ix++) {
        const pt = point(this.olMap.contextMenuAt);
        const poly = polygon([polygons[ix].getCoordinates()[0]]);
        if (booleanPointInPolygon(pt, poly)) break;
      }
    }
    return ix;
  }
}
