import { AbstractMapPage } from '../abstract-map';
import { ContextMenuComponent } from '../../components/contextmenu';
import { ImportLandmarksComponent } from './import-landmarks';
import { RootPage } from '../root/page';
import { SidebarComponent } from '../../components/sidebar-component';

import { Actions } from '@ngxs/store';
import { ActivatedRoute } from '@angular/router';
import { AuthState } from '@lib/state/auth';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { ComponentFactory } from '@angular/core';
import { ComponentFactoryResolver } from '@angular/core';
import { DeleteLandmark } from '@lib/state/landmarks';
import { DestroyService } from '@lib/services/destroy';
import { Landmark } from '@lib/common';
import { LandmarkPropertiesClass } from '@lib/common';
import { MapType } from '@lib/state/map';
import { OLInteractionDrawLandmarksComponent } from '@lib/ol/landmarks/ol-interaction-drawlandmarks';
import { OLInteractionRedrawLandmarkComponent } from '@lib/ol/landmarks/ol-interaction-redrawlandmark';
import { OLOverlayLandmarkLabelComponent } from '@lib/ol/landmarks/ol-overlay-landmarklabel';
import { Router } from '@angular/router';
import { Store } from '@ngxs/store';
import { UpdateLandmark } from '@lib/state/landmarks';
import { ViewChild } from '@angular/core';
import { ViewState } from '@lib/state/view';

import { calculateOrientation } from '@lib/common';

import bbox from '@turf/bbox';
import bboxPolygon from '@turf/bbox-polygon';
import lineToPolygon from '@turf/line-to-polygon';
import OLFeature from 'ol/Feature';
import transformRotate from '@turf/transform-rotate';

interface LandmarkConversion {
  converter: (feature: OLFeature<any>) => Partial<Landmark>;
  geometryType: 'Point' | 'LineString' | 'Polygon';
  label: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DestroyService],
  selector: 'app-property',
  styleUrls: ['../abstract-map.scss', './page.scss'],
  templateUrl: './page.html'
})
export class PropertyPage extends AbstractMapPage {
  @ViewChild(ContextMenuComponent) contextMenu: ContextMenuComponent;

  conversions: LandmarkConversion[] = [
    {
      converter: this.#convertToArea,
      geometryType: 'LineString',
      label: 'area'
    },
    {
      converter: this.#convertToBuilding,
      geometryType: 'Polygon',
      label: 'building'
    },
    {
      converter: this.#convertToCulvert,
      geometryType: 'Point',
      label: 'culvert'
    },
    {
      converter: this.#convertToDistance,
      geometryType: 'LineString',
      label: 'distance'
    },
    {
      converter: this.#convertToDitch,
      geometryType: 'LineString',
      label: 'ditch'
    },
    {
      converter: this.#convertToDriveway,
      geometryType: 'LineString',
      label: 'driveway'
    },
    {
      converter: this.#convertToField,
      geometryType: 'Polygon',
      label: 'field'
    },
    {
      converter: this.#convertToForest,
      geometryType: 'Polygon',
      label: 'forest'
    },
    {
      converter: this.#convertToPlace,
      geometryType: 'Point',
      label: 'place'
    },
    {
      converter: this.#convertToPond,
      geometryType: 'Polygon',
      label: 'pond'
    },
    {
      converter: this.#convertToStonewall,
      geometryType: 'LineString',
      label: 'stonewall'
    },
    {
      converter: this.#convertToStream,
      geometryType: 'LineString',
      label: 'stream'
    },
    {
      converter: this.#convertToTrail,
      geometryType: 'LineString',
      label: 'trail'
    },
    {
      converter: this.#convertToWetland,
      geometryType: 'Polygon',
      label: 'wetland'
    }
  ];

  @ViewChild(OLInteractionDrawLandmarksComponent)
  drawLandmarks: OLInteractionDrawLandmarksComponent;

  @ViewChild(OLOverlayLandmarkLabelComponent)
  moveLandmark: OLOverlayLandmarkLabelComponent;

  @ViewChild(OLInteractionRedrawLandmarkComponent)
  redrawLandmark: OLInteractionRedrawLandmarkComponent;

  constructor(
    protected actions$: Actions,
    protected authState: AuthState,
    protected destroy$: DestroyService,
    protected resolver: ComponentFactoryResolver,
    protected root: RootPage,
    protected route: ActivatedRoute,
    protected router: Router,
    protected store: Store,
    protected viewState: ViewState
  ) {
    super(actions$, authState, destroy$, root, route, router, store, viewState);
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
        const feature = this.olMap.selected[0];
        const landmark = conversion.converter(feature);
        this.store.dispatch(new UpdateLandmark(landmark));
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
        fillColor: '--rgb-blue-gray-600',
        fillOpacity: 0.15,
        fontColor: '--rgb-blue-gray-800',
        fontOpacity: 1,
        fontOutline: true,
        fontSize: 'medium',
        fontStyle: 'normal',
        lineDash: [1, 1],
        name: feature.get('name'),
        showDimension: true,
        strokeColor: '--rgb-blue-gray-800',
        strokeOpacity: 1,
        strokeStyle: 'dashed',
        strokeWidth: 'medium',
        textRotate: true,
        zIndex: feature.get('zIndex')
      }),
      type: 'Feature'
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
        fillColor: '--map-building-fill',
        fillOpacity: 1,
        fontColor: '--map-building-outline',
        fontOpacity: 1,
        fontOutline: true,
        fontSize: 'medium',
        fontStyle: 'italic',
        name: 'Building',
        orientation: feature.get('orientation'),
        shadowColor: '--map-building-outline',
        shadowOffsetFeet: [6, -6],
        shadowOpacity: 0.75,
        showDimension: false,
        strokeColor: '--map-building-outline',
        strokeOpacity: 1,
        strokePixels: 1,
        strokeStyle: 'solid',
        textRotate: true,
        zIndex: 4
      }),
      type: 'Feature'
    };
  }

  #convertToCulvert(feature: OLFeature<any>): Partial<Landmark> {
    return {
      id: feature.getId() as string,
      properties: new LandmarkPropertiesClass({
        fontColor: '--rgb-blue-gray-600',
        fontFeet: 16,
        fontOpacity: 1,
        fontOutline: true,
        fontStyle: 'normal',
        iconOpacity: 1,
        iconSymbol: '\uf1ce' /* 👈 circle-notch */,
        name: 'Culvert',
        textAlign: 'center',
        textBaseline: 'bottom',
        zIndex: 3
      }),
      type: 'Feature'
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
        fontColor: '--rgb-blue-gray-800',
        fontOpacity: 1,
        fontOutline: true,
        fontSize: 'small',
        fontStyle: 'normal',
        showDimension: true,
        strokeColor: '--rgb-blue-gray-800',
        strokeOpacity: 1,
        strokeStyle: 'solid',
        strokeWidth: 'thin',
        zIndex: feature.get('zIndex')
      }),
      type: 'Feature'
    };
  }

  #convertToDitch(feature: OLFeature<any>): Partial<Landmark> {
    return {
      id: feature.getId() as string,
      properties: new LandmarkPropertiesClass({
        lineDash: [1, 1],
        lineSpline: true,
        strokeColor: '--map-river-line-color',
        strokeOpacity: 1,
        strokeStyle: 'dashed',
        strokeWidth: 'thin',
        zIndex: 1
      }),
      type: 'Feature'
    };
  }

  #convertToDriveway(feature: OLFeature<any>): Partial<Landmark> {
    return {
      id: feature.getId() as string,
      properties: new LandmarkPropertiesClass({
        lineSpline: true,
        strokeColor: '--map-road-lane-VI',
        strokeFeet: 15 /* 👈 feet */,
        strokeOpacity: 1,
        strokeOutline: true,
        strokeOutlineColor: '--map-road-edge-VI',
        strokePattern: 'conglomerate',
        strokePatternScale: 0.66,
        strokeStyle: 'solid',
        zIndex: 2
      }),
      type: 'Feature'
    };
  }

  #convertToField(feature: OLFeature<any>): Partial<Landmark> {
    return {
      id: feature.getId() as string,
      properties: new LandmarkPropertiesClass({
        fillColor: '--map-parcel-fill-u190',
        fillOpacity: 0.25,
        fontColor: '--map-conservation-outline',
        fontOpacity: 1,
        fontOutline: true,
        fontSize: 'small',
        fontStyle: 'normal',
        minWidth: feature.get('minWidth'),
        name: 'Field',
        orientation: feature.get('orientation'),
        showDimension: true,
        textLocation: feature.get('textLocation'),
        textRotate: true,
        zIndex: 0
      }),
      type: 'Feature'
    };
  }

  #convertToForest(feature: OLFeature<any>): Partial<Landmark> {
    return {
      id: feature.getId() as string,
      properties: new LandmarkPropertiesClass({
        fillColor: '--map-parcel-fill-u501',
        fillOpacity: 1,
        fillPattern: 'mixtree2',
        fontColor: '--map-conservation-outline',
        fontOpacity: 1,
        fontOutline: true,
        fontSize: 'small',
        fontStyle: 'normal',
        minWidth: feature.get('minWidth'),
        name: 'Forest',
        orientation: feature.get('orientation'),
        showDimension: true,
        textLocation: feature.get('textLocation'),
        textRotate: true,
        zIndex: 0
      }),
      type: 'Feature'
    };
  }

  #convertToPlace(feature: OLFeature<any>): Partial<Landmark> {
    return {
      id: feature.getId() as string,
      properties: new LandmarkPropertiesClass({
        fontColor: '--map-place-text-color',
        fontOpacity: 1,
        fontOutline: true,
        fontSize: 'large',
        fontStyle: 'italic',
        name: 'Place',
        zIndex: 5
      }),
      type: 'Feature'
    };
  }

  #convertToPond(feature: OLFeature<any>): Partial<Landmark> {
    return {
      id: feature.getId() as string,
      properties: new LandmarkPropertiesClass({
        fillColor: '--map-waterbody-fill',
        fillOpacity: 1,
        fontColor: '--map-place-water-color',
        fontOpacity: 1,
        fontOutline: true,
        fontSize: 'medium',
        fontStyle: 'italic',
        minWidth: feature.get('minWidth'),
        name: 'Pond',
        orientation: feature.get('orientation'),
        textLocation: feature.get('textLocation'),
        textRotate: true,
        zIndex: 4
      }),
      type: 'Feature'
    };
  }

  #convertToStonewall(feature: OLFeature<any>): Partial<Landmark> {
    return {
      id: feature.getId() as string,
      properties: new LandmarkPropertiesClass({
        strokeColor: '--map-stonewall-rocks',
        strokeOpacity: 0.5,
        strokePattern: 'rocks',
        strokePatternScale: 2,
        strokeStyle: 'solid',
        strokeWidth: 'medium',
        zIndex: 4
      }),
      type: 'Feature'
    };
  }

  #convertToStream(feature: OLFeature<any>): Partial<Landmark> {
    return {
      id: feature.getId() as string,
      properties: new LandmarkPropertiesClass({
        fontColor: '--map-place-water-color',
        fontOpacity: 1,
        fontOutline: true,
        fontSize: 'medium',
        fontStyle: 'italic',
        lineChunk: true,
        lineSpline: true,
        name: 'Stream',
        strokeColor: '--map-river-line-color',
        strokeOpacity: 1,
        strokeStyle: 'solid',
        strokeWidth: 'medium',
        zIndex: 1
      }),
      type: 'Feature'
    };
  }

  #convertToTrail(feature: OLFeature<any>): Partial<Landmark> {
    return {
      id: feature.getId() as string,
      properties: new LandmarkPropertiesClass({
        fontColor: '--map-trail-text-color',
        fontOpacity: 1,
        fontOutline: true,
        fontSize: 'medium',
        fontStyle: 'italic',
        lineChunk: true,
        lineDash: [2, 1],
        lineSpline: true,
        name: 'Trail',
        strokeColor: '--map-trail-line-color',
        strokeOpacity: 1,
        strokeStyle: 'dashed',
        strokeWidth: 'medium',
        zIndex: 2
      }),
      type: 'Feature'
    };
  }

  #convertToWetland(feature: OLFeature<any>): Partial<Landmark> {
    return {
      id: feature.getId() as string,
      properties: new LandmarkPropertiesClass({
        fillColor: '--map-wetland-swamp',
        fillOpacity: 0.75,
        fillPattern: 'swamp',
        fontColor: '--map-place-water-color',
        fontOpacity: 1,
        fontOutline: true,
        fontSize: 'small',
        fontStyle: 'normal',
        minWidth: feature.get('minWidth'),
        name: 'Wetland',
        orientation: feature.get('orientation'),
        showDimension: true,
        textLocation: feature.get('textLocation'),
        textRotate: true,
        zIndex: 0
      }),
      type: 'Feature'
    };
  }

  #renameTo(name: string): void {
    const feature = this.olMap.selected[0];
    const landmark: Partial<Landmark> = {
      id: feature.getId() as string,
      properties: {
        name: name
      },
      type: 'Feature'
    };
    this.store.dispatch(new UpdateLandmark(landmark));
  }

  canConvertFor(conversion: LandmarkConversion): boolean {
    const feature = this.olMap.selected[0];
    return (
      this.olMap.selected.length === 1 &&
      conversion.geometryType === feature.getGeometry().getType()
    );
  }

  canConvertLandmark(event?: MouseEvent): boolean {
    return this.#can(event, this.olMap.selected.length === 1);
  }

  canDeleteLandmarks(event?: MouseEvent): boolean {
    return this.#can(event, this.olMap.selected.length > 0);
  }

  canDrawLandmarks(event?: MouseEvent): boolean {
    return this.#can(event, true);
  }

  canImportLandmarks(event?: MouseEvent): boolean {
    return this.#can(event, true);
  }

  canMoveLandmark(event?: MouseEvent): boolean {
    const feature = this.olMap.selected[0];
    return this.#can(
      event,
      this.olMap.selected.length === 1 &&
        feature.get('name') &&
        ['Point', 'Polygon'].includes(feature.getGeometry().getType())
    );
  }

  canRedrawLandmark(event?: MouseEvent): boolean {
    const feature = this.olMap.selected[0];
    return this.#can(
      event,
      this.olMap.selected.length === 1 &&
        ['LineString', 'Polygon'].includes(feature.getGeometry().getType())
    );
  }

  canRenameLandmark(event?: MouseEvent): boolean {
    return this.#can(event, this.olMap.selected.length === 1);
  }

  eatMe(event: MouseEvent): void {
    event.stopPropagation();
  }

  getType(): MapType {
    return 'property';
  }

  onContextMenu(key: string, opaque?: any): void {
    let cFactory: ComponentFactory<SidebarComponent>;
    switch (key) {
      case 'convert-landmark':
        this.#convertTo(opaque);
        break;
      case 'delete-landmarks':
        this.store.dispatch(
          this.olMap.selectedIDs.map((id) => new DeleteLandmark({ id }))
        );
        break;
      case 'draw-landmarks':
        if (opaque) this.drawLandmarks.startDraw(opaque);
        break;
      case 'import-landmarks':
        cFactory = this.resolver.resolveComponentFactory(
          ImportLandmarksComponent
        );
        break;
      case 'move-landmark':
        this.moveLandmark.setFeature(this.olMap.selected[0]);
        break;
      case 'redraw-landmark':
        this.redrawLandmark.setFeature(this.olMap.selected[0]);
        break;
      case 'rename-landmark':
        this.#renameTo(opaque);
        break;
    }
    if (cFactory) this.onContextMenuImpl(cFactory);
    // 👇 in some cases, doesn't close itself
    this.contextMenu.closeMenu();
  }
}
