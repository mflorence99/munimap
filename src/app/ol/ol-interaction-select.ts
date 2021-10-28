import { Mapable } from './ol-mapable';
import { MapableComponent } from './ol-mapable';
import { OLLayerVectorComponent } from './ol-layer-vector';
import { OLMapComponent } from './ol-map';

import { AfterContentInit } from '@angular/core';
import { ChangeDetectionStrategy } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { Component } from '@angular/core';
import { ContentChild } from '@angular/core';
import { EventEmitter } from '@angular/core';
import { Input } from '@angular/core';
import { MatMenu } from '@angular/material/menu';
import { MatMenuTrigger } from '@angular/material/menu';
import { OnDestroy } from '@angular/core';
import { Output } from '@angular/core';
import { SelectEvent as OLSelectEvent } from 'ol/interaction/Select';
import { ViewChild } from '@angular/core';

import { forwardRef } from '@angular/core';
import { transformExtent } from 'ol/proj';

import bbox from '@turf/bbox';
import OLFeature from 'ol/Feature';
import OLSelect from 'ol/interaction/Select';

export type FilterFunction = (feature: OLFeature<any>) => boolean;

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: MapableComponent,
      useExisting: forwardRef(() => OLInteractionSelectComponent)
    }
  ],
  selector: 'app-ol-interaction-select',
  templateUrl: './ol-interaction-select.html',
  styleUrls: ['./ol-interaction-select.scss']
})
export class OLInteractionSelectComponent
  implements AfterContentInit, Mapable, OnDestroy
{
  @ContentChild(MatMenu) contextMenu: MatMenu;
  @ViewChild(MatMenuTrigger) contextMenuTrigger: MatMenuTrigger;

  @Input() eventType: string;

  @Output() featuresSelected = new EventEmitter<OLFeature<any>[]>();

  @Input() filter: FilterFunction;

  menuPosition = {
    x: 0,
    y: 0
  };

  @Input() multi = false;

  olSelect: OLSelect;

  get selected(): OLFeature<any>[] {
    return this.olSelect.getFeatures().getArray();
  }

  @Input() zoomAnimationDuration = 200;

  constructor(
    private cdf: ChangeDetectorRef,
    private layer: OLLayerVectorComponent,
    private map: OLMapComponent
  ) {
    this.olSelect = new OLSelect({
      condition: (event): boolean =>
        event.type === this.eventType.toLowerCase(),
      filter: this.#filter.bind(this),
      layers: [this.layer.olLayer],
      style: this.layer.style?.styleWhenSelected()
    });
    // 👉 register this selector with the map
    this.map.selector = this;
  }

  #filter(feature: OLFeature<any>): boolean {
    return this.filter ? this.filter(feature) : true;
  }

  #onSelect(_event?: OLSelectEvent): void {
    const ids = this.selected.map((feature) => feature.getId()).join(', ');
    console.log(`%cSelected features`, 'color: lightcoral', `[${ids}]`);
    this.featuresSelected.emit(this.selected);
  }

  addToMap(): void {
    this.map.olMap.addInteraction(this.olSelect);
  }

  ngAfterContentInit(): void {
    this.olSelect.on('select', this.#onSelect.bind(this));
  }

  ngOnDestroy(): void {
    this.olSelect.un('select', this.#onSelect.bind(this));
  }

  // 👉 see OLMapComponent for wiring
  // 👉 see https://marco.dev/angular-right-click-menu
  onContextMenu(event: PointerEvent): void {
    if (this.contextMenu && this.selected.length > 0) {
      const style = getComputedStyle(document.documentElement);
      const hack = style.getPropertyValue('--map-cy-toolbar');
      this.menuPosition.x = event.clientX + 8;
      this.menuPosition.y = event.clientY + 8 - Number(hack);
      this.cdf.detectChanges();
      this.contextMenuTrigger.openMenu();
    }
  }

  selectParcels(parcels: GeoJSON.Feature[]): void {
    const geojson = {
      features: parcels,
      type: 'FeatureCollection'
    };
    // 👇 find the union of the extent of all parcels
    const extent = transformExtent(
      bbox(geojson),
      this.map.featureProjection,
      this.map.projection
    );
    // 👇 when these parcels are available, select them
    const ids = parcels.map((parcel) => parcel.properties.id);
    this.layer.olLayer.getSource().once('featuresloadend', () => {
      this.olSelect.getFeatures().clear();
      this.layer.olLayer.getSource().forEachFeature((feature) => {
        const props = feature.getProperties();
        if (ids.includes(props.id)) this.olSelect.getFeatures().push(feature);
      });
      this.#onSelect();
    });
    // 👇 zoom to the extent of all the selected  parcels
    this.map.olView.fit(extent, {
      duration: this.zoomAnimationDuration,
      maxZoom: this.map.maxZoom,
      size: this.map.olMap.getSize()
    });
  }
}
