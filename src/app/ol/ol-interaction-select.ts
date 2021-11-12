import { DestroyService } from '../services/destroy';
import { Feature } from '../common';
import { Mapable } from './ol-mapable';
import { MapableComponent } from './ol-mapable';
import { OLLayerVectorComponent } from './ol-layer-vector';
import { OLMapComponent } from './ol-map';
import { ParcelID } from '../common';

import { AfterContentInit } from '@angular/core';
import { ChangeDetectionStrategy } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { Component } from '@angular/core';
import { ContentChild } from '@angular/core';
import { EventEmitter } from '@angular/core';
import { EventsKey as OLEventsKey } from 'ol/events';
import { Input } from '@angular/core';
import { MatMenu } from '@angular/material/menu';
import { MatMenuTrigger } from '@angular/material/menu';
import { OnDestroy } from '@angular/core';
import { OnInit } from '@angular/core';
import { Output } from '@angular/core';
import { SelectEvent as OLSelectEvent } from 'ol/interaction/Select';
import { ViewChild } from '@angular/core';

import { extend } from 'ol/extent';
import { forwardRef } from '@angular/core';
import { takeUntil } from 'rxjs/operators';
import { transformExtent } from 'ol/proj';
import { unByKey } from 'ol/Observable';

import Debounce from 'debounce-decorator';
import OLFeature from 'ol/Feature';
import OLSelect from 'ol/interaction/Select';

export type FilterFunction = (feature: OLFeature<any>) => boolean;

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: MapableComponent,
      useExisting: forwardRef(() => OLInteractionSelectComponent)
    },
    DestroyService
  ],
  selector: 'app-ol-interaction-select',
  templateUrl: './ol-interaction-select.html',
  styleUrls: ['./ol-interaction-select.scss']
})
export class OLInteractionSelectComponent
  implements AfterContentInit, Mapable, OnDestroy, OnInit
{
  #featuresLoadEndKey: OLEventsKey = null;
  #selectKey: OLEventsKey = null;

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

  get selectedIDs(): ParcelID[] {
    return this.selected.map((feature) => feature.getId());
  }

  @Input() zoomAnimationDuration = 200;

  constructor(
    private cdf: ChangeDetectorRef,
    private destroy$: DestroyService,
    // 👉 we need public access to go through the selector to its layer
    public layer: OLLayerVectorComponent,
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

  #handleContextMenu$(): void {
    this.map.contextMenu$
      .pipe(takeUntil(this.destroy$))
      .subscribe((event: PointerEvent) => {
        if (this.contextMenu) {
          // 👉 need to hack the Y offset by the height of the toolbar
          const style = getComputedStyle(document.documentElement);
          const hack = style.getPropertyValue('--map-cy-toolbar');
          const pixel = [event.clientX, event.clientY - Number(hack)];
          // 👉 position the menu
          this.menuPosition.x = pixel[0] + 8;
          this.menuPosition.y = pixel[1] + 8;
          // 👉 simulate singleclick by selecting the feature we're over
          //    https://gis.stackexchange.com/questions/148428
          const cb = (feature: any, layer: any): void => {
            if (
              layer === this.layer.olLayer &&
              !this.selectedIDs.includes(feature.getId())
            ) {
              console.log(
                `%cSelected feature`,
                'color: orchid',
                feature.getId()
              );
              this.olSelect.getFeatures().push(feature);
              this.featuresSelected.emit(this.selected);
            }
          };
          this.map.olMap.forEachFeatureAtPixel(pixel, cb);
          // 👉 because event is triggered out of the Angular zone
          this.cdf.detectChanges();
          this.contextMenuTrigger.openMenu();
        }
      });
  }

  #onSelect(_event?: OLSelectEvent): void {
    const ids = this.selectedIDs.join(', ');
    console.log(`%cSelected features`, 'color: lightcoral', `[${ids}]`);
    this.featuresSelected.emit(this.selected);
  }

  #selectParcels(ids: ParcelID[]): void {
    this.olSelect.getFeatures().clear();
    this.layer.olLayer.getSource().forEachFeature((feature) => {
      if (ids.includes(feature.getId()))
        this.olSelect.getFeatures().push(feature);
    });
    this.#onSelect();
  }

  addToMap(): void {
    this.map.olMap.addInteraction(this.olSelect);
  }

  ngAfterContentInit(): void {
    this.#selectKey = this.olSelect.on('select', this.#onSelect.bind(this));
  }

  ngOnDestroy(): void {
    if (this.#selectKey) unByKey(this.#selectKey);
    if (this.#featuresLoadEndKey) unByKey(this.#featuresLoadEndKey);
  }

  ngOnInit(): void {
    this.#handleContextMenu$();
  }

  reselectParcels(ids: ParcelID[]): void {
    this.#selectParcels(ids);
  }

  @Debounce(250) selectParcels(parcels: Feature[]): void {
    // 👇 assume these parcels are degenerate and that all we have
    //    available is ID and bbox
    const bbox = parcels.reduce(
      (bbox, parcel) => extend(bbox, parcel.bbox),
      [...parcels[0].bbox]
    );
    // 👉 that's the union of the extent
    const extent = transformExtent(
      bbox,
      this.map.featureProjection,
      this.map.projection
    );
    // 👇 setup a listener to select later if the zoom loads more parcels
    const ids = parcels.map((parcel) => parcel.id);
    if (this.#featuresLoadEndKey) unByKey(this.#featuresLoadEndKey);
    this.#featuresLoadEndKey = this.layer.olLayer
      .getSource()
      .once('featuresloadend', () => this.#selectParcels(ids));
    // 👇 zoom to the extent of all the selected  parcels and select them
    this.map.olView.fit(extent, {
      callback: () => this.#selectParcels(ids),
      duration: this.zoomAnimationDuration,
      maxZoom: this.map.maxZoom,
      size: this.map.olMap.getSize()
    });
  }
}
