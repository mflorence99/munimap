import { AbstractMapPage } from '../abstract-map';
import { AddParcelComponent } from './add-parcel';
import { ContextMenuHostDirective } from '../../directives/contextmenu-host';
import { CreatePropertyMapComponent } from './create-propertymap';
import { MergeParcelsComponent } from './merge-parcels';
import { ParcelPropertiesComponent } from './parcel-properties';
import { SidebarComponent } from '../../components/sidebar-component';
import { SubdivideParcelComponent } from './subdivide-parcel';

import { AddParcels } from '@lib/state/parcels';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { DestroyService } from '@lib/services/destroy';
import { MapType } from '@lib/state/map';
import { MatDrawer } from '@angular/material/sidenav';
import { OLInteractionRedrawParcelComponent } from '@lib/ol/ol-interaction-redrawparcel';
import { OLMapComponent } from '@lib/ol/ol-map';
import { OLOverlayParcelLabelComponent } from '@lib/ol/ol-overlay-parcellabel';
import { OnInit } from '@angular/core';
import { Parcel } from '@lib/common';
import { ParcelPropertiesLabel } from '@lib/common';
import { Type } from '@angular/core';

import { calculateParcel } from '@lib/common';
import { fromLonLat } from 'ol/proj';
import { point } from '@turf/helpers';
import { polygon } from '@turf/helpers';
import { toLonLat } from 'ol/proj';
import { viewChild } from '@angular/core';

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
    <app-sink
      #sink
      [mapState]="root.mapState$ | async"
      [profile]="root.profile$ | async"
      [user]="root.user$ | async" />

    @if (sink.mapState) {
      <mat-drawer-container class="container">
        <mat-drawer-content class="content">
          <app-ol-map
            #map
            [loadingStrategy]="'bbox'"
            [minZoom]="15"
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
              class="setup"
              mapControlPanel1></app-controlpanel-properties>

            <app-ol-control-searchparcels
              mapControlSearch></app-ol-control-searchparcels>

            <app-ol-control-zoom mapControlZoom></app-ol-control-zoom>

            @if (sink.mapState.name) {
              <app-ol-control-print
                [fileName]="sink.mapState.name"
                [printSize]="sink.mapState.printSize"
                mapControlPrint></app-ol-control-print>
            }

            @if (sink.mapState.name) {
              <app-ol-control-exportparcels
                [fileName]="sink.mapState.id + '-parcels'"
                mapControlExport></app-ol-control-exportparcels>
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

              @if (sink.mapState.name && map.printing) {
                <app-ol-control-parcelslegend
                  [county]="sink.mapState.path.split(':')[1]"
                  [id]="sink.mapState.id"
                  [printing]="map.printing"
                  [state]="sink.mapState.path.split(':')[0]"
                  [title]="sink.mapState.name"></app-ol-control-parcelslegend>
              }

              @if (!map.printing) {
                <app-ol-control-scaleline></app-ol-control-scaleline>
              } @else {
                <app-ol-control-scalebar></app-ol-control-scalebar>
                <app-ol-control-credits></app-ol-control-credits>
              }

              <!-- -------------------------------------------------------- -->
              <!-- 🗺️ Normal view                                           -->
              <!-- -------------------------------------------------------- -->

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
                <app-ol-filter-colorize
                  [operation]="'enhance'"
                  [value]="0.33"></app-ol-filter-colorize>
              </app-ol-layer-tile>

              <app-ol-layer-vector>
                <app-ol-style-parcels
                  [parcelCoding]="'usage'"
                  [showBackground]="'always'"
                  [showStolen]="
                    isPrivileged() && !map.printing ? 'always' : 'never'
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

              <!-- -------------------------------------------------------- -->
              <!-- 🗺️ Lot lines (printed)                                   -->
              <!-- -------------------------------------------------------- -->

              @if (map.printing) {
                <app-ol-layer-vector>
                  <app-ol-style-parcels
                    [showBorder]="'always'"
                    [showLabels]="'always'"
                    [showStolen]="
                      isPrivileged() && !map.printing ? 'always' : 'never'
                    "></app-ol-style-parcels>
                  <app-ol-source-parcels></app-ol-source-parcels>
                </app-ol-layer-vector>
              }

              <!-- -------------------------------------------------------- -->
              <!-- 🗺️ Lot lines + selection (screen)                        -->
              <!-- -------------------------------------------------------- -->

              @if (!map.printing) {
                <app-ol-layer-vector>
                  <app-ol-style-parcels
                    [showBorder]="'always'"
                    [showDimensions]="'whenSelected'"
                    [showLabels]="'always'"
                    [showSelection]="'always'"
                    [showStolen]="
                      isPrivileged() && !map.printing ? 'always' : 'never'
                    "></app-ol-style-parcels>
                  <app-ol-source-parcels></app-ol-source-parcels>
                  <app-ol-interaction-selectparcels></app-ol-interaction-selectparcels>
                  <app-ol-interaction-redrawparcel></app-ol-interaction-redrawparcel>
                </app-ol-layer-vector>
              }

              <!-- -------------------------------------------------------- -->
              <!-- 🗺️ Road names (b/c lot lines overlay road)               -->
              <!-- -------------------------------------------------------- -->

              <app-ol-layer-vector>
                <app-ol-adaptor-roads>
                  <app-ol-style-universal
                    [showText]="true"></app-ol-style-universal>
                </app-ol-adaptor-roads>
                <app-ol-source-geojson
                  [layerKey]="'roads'"></app-ol-source-geojson>
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
                @if (isPrivileged()) {
                  <app-ol-interaction-redrawboundary></app-ol-interaction-redrawboundary>
                }
              </app-ol-layer-vector>

              <!-- -------------------------------------------------------- -->
              <!-- 🗺️ Overlay to move parcel label                          -->
              <!-- -------------------------------------------------------- -->

              @if (!map.printing) {
                <app-ol-overlay-parcellabel></app-ol-overlay-parcellabel>
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
            Parcels {{ map().selectedIDs.join(', ') }}
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
  `
})
export class ParcelsPage extends AbstractMapPage implements OnInit {
  contextMenuHost = viewChild(ContextMenuHostDirective);
  drawer = viewChild(MatDrawer);
  interactionRedraw = viewChild(OLInteractionRedrawParcelComponent);
  map = viewChild(OLMapComponent);
  overlayLabel = viewChild(OLOverlayParcelLabelComponent);

  canAddParcel(event?: MouseEvent): boolean {
    return this.#can(event, this.map().selectedIDs.length === 0);
  }

  canAddPolygon(event?: MouseEvent): boolean {
    return this.#can(event, this.map().selectedIDs.length === 1);
  }

  canCreatePropertyMap(event?: MouseEvent): boolean {
    return this.#can(event, this.map().selectedIDs.length >= 1);
  }

  canDeletePolygon(event?: MouseEvent): boolean {
    return this.#can(
      event,
      this.map().selectedIDs.length === 1 &&
        this.map().selected[0].getGeometry().getType() === 'MultiPolygon'
    );
  }

  canMergeParcels(event?: MouseEvent): boolean {
    return this.#can(event, this.map().selectedIDs.length > 1);
  }

  canParcelProperties(event?: MouseEvent): boolean {
    return this.#can(event, this.map().selectedIDs.length > 0);
  }

  canRecenterLabel(event?: MouseEvent): boolean {
    return this.#can(event, this.map().selectedIDs.length === 1);
  }

  canRedrawBoundary(event?: MouseEvent): boolean {
    return this.#can(event, this.map().selectedIDs.length === 1);
  }

  canRotateLabel(event?: MouseEvent): boolean {
    return this.#can(event, this.map().selectedIDs.length === 1);
  }

  canSplitLabel(event?: MouseEvent): boolean {
    return this.#can(event, this.map().selectedIDs.length === 1);
  }

  canSubdivideParcel(event?: MouseEvent): boolean {
    return this.#can(event, this.map().selectedIDs.length === 1);
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
        this.#addPolygon(this.map().selected[0]);
        break;
      case 'create-propertymap':
        component = CreatePropertyMapComponent;
        break;
      case 'delete-polygon':
        this.#deletePolygon(this.map().selected[0]);
        break;
      case 'parcel-properties':
        component = ParcelPropertiesComponent;
        break;
      case 'merge-parcels':
        component = MergeParcelsComponent;
        break;
      case 'recenter-label':
        this.overlayLabel().setFeature(this.map().selected[0]);
        break;
      case 'redraw-boundary':
        this.interactionRedraw().setFeature(this.map().selected[0]);
        break;
      case 'rotate-label':
        this.#rotateLabel(this.map().selected[0]);
        break;
      case 'split-label':
        this.#splitLabel(this.map().selected[0]);
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
        circle(toLonLat(this.map().contextMenuAt), 100, {
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
    this.#modifyFeature(feature, { doGeometry: true });
  }

  #can(event: MouseEvent, condition: boolean): boolean {
    if (!condition && event) event.stopPropagation();
    return condition;
  }

  #deletePolygon(feature: OLFeature<any>): void {
    const coords = feature.getGeometry().getCoordinates();
    coords.splice(this.#whichPolygon(feature), 1);
    feature.getGeometry().setCoordinates(coords);
    this.#modifyFeature(feature, { doGeometry: true });
  }

  #modifyFeature(
    feature: OLFeature<any>,
    opts: { doGeometry?: boolean; doProperties?: boolean } = {}
  ): void {
    const format = new OLGeoJSON({
      dataProjection: this.map().featureProjection,
      featureProjection: this.map().projection
    });
    // 👉 convert to feature to geojson and recalculate centers etc
    const parcel = JSON.parse(format.writeFeature(feature));
    calculateParcel(parcel);
    feature.setProperties(parcel.properties);
    // 👉 record the modification
    const redrawnParcel: Parcel = {
      action: 'modified',
      geometry: opts.doGeometry ? parcel.geometry : null,
      id: feature.getId(),
      owner: this.authState.currentProfile().email,
      path: this.map().path(),
      properties: opts.doProperties ? parcel.properties : null,
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
    this.#modifyFeature(feature, { doProperties: true });
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
    this.#modifyFeature(feature, { doProperties: true });
  }

  #whichPolygon(feature: OLFeature<any>): number {
    let ix = 0;
    if (feature.getGeometry().getType() === 'MultiPolygon') {
      const polygons = feature.getGeometry().getPolygons();
      for (ix = 0; ix < polygons.length; ix++) {
        const pt = point(this.map().contextMenuAt);
        const poly = polygon([polygons[ix].getCoordinates()[0]]);
        if (booleanPointInPolygon(pt, poly)) break;
      }
    }
    return ix;
  }
}
