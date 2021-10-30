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
  get selectedIDs(): string[] {
    return this.selected.map((feature) => String(feature.getId()));
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
    const ids = this.selectedIDs.join(', ');
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
    // 👇 assume these parcels are degenerate and that all we have
    //    available is ID and bbox
    const bbox = parcels.reduce(
      (acc, parcel) => {
        const [minX, minY, maxX, maxY] = parcel.bbox;
        acc[0] = Math.min(acc[0], minX);
        acc[1] = Math.min(acc[1], minY);
        acc[2] = Math.max(acc[2], maxX);
        acc[3] = Math.max(acc[3], maxY);
        return acc;
      },
      [
        Number.MAX_SAFE_INTEGER,
        Number.MAX_SAFE_INTEGER,
        Number.MIN_SAFE_INTEGER,
        Number.MIN_SAFE_INTEGER
      ]
    );
    // 👉 that's the union of the extent
    const extent = transformExtent(
      bbox,
      this.map.featureProjection,
      this.map.projection
    );
    // 👇 at least some the parcels might be visible
    //    we'll select what we can now
    const ids = parcels.map((parcel) => parcel.properties.id);
    this.olSelect.getFeatures().clear();
    this.layer.olLayer.getSource().forEachFeature((feature) => {
      const props = feature.getProperties();
      if (ids.includes(props.id)) this.olSelect.getFeatures().push(feature);
    });
    this.#onSelect();
    // 👇 OK -- they weren't all visible
    //    so when these parcels are available, select them
    if (ids.length !== this.olSelect.getFeatures().getLength()) {
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
}
