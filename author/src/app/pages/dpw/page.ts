import { AbstractMapPage } from '../abstract-map';
import { ContextMenuComponent } from '../../components/contextmenu';
import { ContextMenuHostDirective } from '../../directives/contextmenu-host';
import { CulvertPropertiesComponent } from './culvert-properties';
import { ImportCulvertsComponent } from './import-culverts';
import { RootPage } from '../root/page';
import { SidebarComponent } from '../../components/sidebar-component';

import { Actions } from '@ngxs/store';
import { ActivatedRoute } from '@angular/router';
import { AddLandmark } from '@lib/state/landmarks';
import { AuthState } from '@lib/state/auth';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { CulvertProperties } from '@lib/common';
import { DeleteLandmark } from '@lib/state/landmarks';
import { DestroyService } from '@lib/services/destroy';
import { Landmark } from '@lib/common';
import { Map } from '@lib/state/map';
import { MapState } from '@lib/state/map';
import { MapType } from '@lib/state/map';
import { MatDrawer } from '@angular/material/sidenav';
import { Observable } from 'rxjs';
import { OLMapComponent } from '@lib/ol/ol-map';
import { OLOverlayLandmarkLabelComponent } from '@lib/ol/landmarks/ol-overlay-landmarklabel';
import { OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Select } from '@ngxs/store';
import { Store } from '@ngxs/store';
import { Type } from '@angular/core';
import { ViewChild } from '@angular/core';
import { ViewState } from '@lib/state/view';

import { culvertConditions } from '@lib/common';
import { culvertFloodHazards } from '@lib/common';
import { culvertHeadwalls } from '@lib/common';
import { culvertMaterials } from '@lib/common';
import { makeLandmarkID } from '@lib/common';
import { toLonLat } from 'ol/proj';

// 🔥 only culverts are supported for now

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DestroyService],
  selector: 'app-dpw',
  template: `
    @if (mapState$ | async; as map) {
      <mat-drawer-container class="container">
        <mat-drawer-content class="content">
          <app-ol-map
            #olMap
            [loadingStrategy]="'bbox'"
            [minZoom]="13"
            [maxZoom]="20"
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
              <app-ol-control-exportlandmarks
                [fileName]="map.id + '-sites'"
                mapControlExport></app-ol-control-exportlandmarks>
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

                <!-- 📦 HILLSHADE LAYER =-->

                <app-ol-layer-tile [opacity]="0.5">
                  <app-ol-source-hillshade
                    [colorize]="true"></app-ol-source-hillshade>
                  <app-ol-filter-crop2boundary></app-ol-filter-crop2boundary>
                </app-ol-layer-tile>

                <!-- 📦 NH GranIT VECTOR LAYERS -->

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
                  <app-ol-adaptor-powerlines>
                    <app-ol-style-universal
                      [showAll]="true"></app-ol-style-universal>
                  </app-ol-adaptor-powerlines>
                  <app-ol-source-geojson
                    [layerKey]="'powerlines'"></app-ol-source-geojson>
                  <app-ol-filter-crop2boundary></app-ol-filter-crop2boundary>
                </app-ol-layer-vector>

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
                  <app-ol-source-landmarks></app-ol-source-landmarks>
                  <app-ol-interaction-selectlandmarks
                    [layers]="[
                      bridges,
                      streamcrossings,
                      floodhazards,
                      landmarks
                    ]"
                    [multi]="false"></app-ol-interaction-selectlandmarks>
                </app-ol-layer-vector>
              }

              <!-- 📦 SATELLITE LAYER  -->

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
                  <app-ol-source-landmarks></app-ol-source-landmarks>
                  <app-ol-interaction-selectlandmarks
                    [layers]="[
                      bridges,
                      streamcrossings,
                      floodhazards,
                      landmarks
                    ]"
                    [multi]="false"></app-ol-interaction-selectlandmarks>
                </app-ol-layer-vector>
              }

              <!-- 📦 BOUNDARY LAYER -->

              <app-ol-layer-vector>
                <app-ol-adaptor-boundary>
                  <app-ol-style-universal
                    [showStroke]="true"></app-ol-style-universal>
                </app-ol-adaptor-boundary>
                <app-ol-source-boundary></app-ol-source-boundary>
              </app-ol-layer-vector>

              <!-- 📦 OVERLAY TO MOVE LANDMARK -->

              @if (!olMap.printing) {
                <app-ol-overlay-landmarklabel></app-ol-overlay-landmarklabel>
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
        <ul>
          <li
            (click)="
              canImportCulverts($event) && onContextMenu('import-culverts')
            "
            [class.disabled]="!canImportCulverts()"
            class="item">
            <fa-icon
              [fixedWidth]="true"
              [icon]="['far', 'file-import']"></fa-icon>
            <p>Import from GPX or KML files &hellip;</p>
          </li>

          <li
            (click)="canAddCulvert($event) && onContextMenu('add-culvert')"
            [class.disabled]="!canAddCulvert()"
            class="item">
            <fa-icon
              [fixedWidth]="true"
              [icon]="['fas', 'plus-square']"></fa-icon>
            <p>New culvert here</p>
          </li>

          <li
            (click)="
              canCulvertProperties($event) &&
                onContextMenu('culvert-properties')
            "
            [class.disabled]="!canCulvertProperties()"
            class="item">
            <fa-icon [fixedWidth]="true" [icon]="['fas', 'tasks']"></fa-icon>
            <p>Modify culvert settings &hellip;</p>
          </li>

          <li
            (click)="canMoveCulvert($event) && onContextMenu('move-culvert')"
            [class.disabled]="!canMoveCulvert()"
            class="item">
            <fa-icon
              [fixedWidth]="true"
              [icon]="['fas', 'crosshairs']"></fa-icon>
            <p>
              Move culvert
              <em>
                <fa-icon
                  [icon]="['fas', 'question-circle']"
                  matTooltip="Click and drag the target icon to the new position"></fa-icon>
              </em>
            </p>
          </li>

          <li
            (click)="
              canDeleteCulvert($event) && onContextMenu('delete-culvert')
            "
            [class.disabled]="!canDeleteCulvert()"
            class="item">
            <fa-icon [fixedWidth]="true" [icon]="['fas', 'trash']"></fa-icon>
            <p>Delete culvert</p>
          </li>
        </ul>
      </nav>
    </ng-template>
  `,
  styleUrls: ['../abstract-map.scss']
})
export class DPWPage extends AbstractMapPage implements OnInit {
  @ViewChild(ContextMenuComponent) contextMenu: ContextMenuComponent;

  @ViewChild(ContextMenuHostDirective)
  contextMenuHost: ContextMenuHostDirective;

  @ViewChild('drawer') drawer: MatDrawer;

  @Select(MapState) mapState$: Observable<Map>;

  @ViewChild(OLOverlayLandmarkLabelComponent)
  moveLandmark: OLOverlayLandmarkLabelComponent;

  @ViewChild(OLMapComponent) olMap: OLMapComponent;

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

  canAddCulvert(event?: MouseEvent): boolean {
    return this.#can(event, true);
  }

  canCulvertProperties(event?: MouseEvent): boolean {
    return this.#can(
      event,
      !this.olMap.roSelection && this.olMap.selected.length === 1
    );
  }

  canDeleteCulvert(event?: MouseEvent): boolean {
    return this.#can(
      event,
      !this.olMap.roSelection && this.olMap.selected.length === 1
    );
  }

  canImportCulverts(event?: MouseEvent): boolean {
    return this.#can(event, true);
  }

  canMoveCulvert(event?: MouseEvent): boolean {
    return this.#can(
      event,
      !this.olMap.roSelection && this.olMap.selected.length === 1
    );
  }

  getType(): MapType {
    return 'dpw';
  }

  ngOnInit(): void {
    this.onInit();
  }

  onContextMenu(key: string): void {
    let component: Type<SidebarComponent>;
    switch (key) {
      case 'add-culvert':
        this.#createCulvert();
        break;
      case 'delete-culvert':
        this.store.dispatch(
          new DeleteLandmark({ id: this.olMap.selectedIDs[0] })
        );
        break;
      case 'import-culverts':
        component = ImportCulvertsComponent;
        break;
      case 'culvert-properties':
        component = CulvertPropertiesComponent;
        break;
      case 'move-culvert':
        this.moveLandmark.setFeature(this.olMap.selected[0]);
        break;
    }
    if (component) this.onContextMenuImpl(component);
    // 👇 in some cases, doesn't close itself
    this.contextMenu.closeMenu();
  }

  #can(event: MouseEvent, condition: boolean): boolean {
    if (!condition && event) event.stopPropagation();
    return condition;
  }

  #createCulvert(): void {
    const landmark: Partial<Landmark> = {
      geometry: {
        coordinates: toLonLat(this.olMap.contextMenuAt),
        type: 'Point'
      },
      owner: this.authState.currentProfile().email,
      path: this.olMap.path,
      properties: {
        metadata: {
          condition: culvertConditions[0],
          count: 1,
          diameter: 12,
          floodHazard: culvertFloodHazards[0],
          headwall: culvertHeadwalls[0],
          length: 20,
          material: culvertMaterials[0],
          type: 'culvert',
          year: null
        } as Partial<CulvertProperties>
      },
      type: 'Feature'
    };
    landmark.id = makeLandmarkID(landmark);
    this.store.dispatch(new AddLandmark(landmark));
  }
}
