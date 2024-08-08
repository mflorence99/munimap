import { Parcel } from '../common';
import { ParcelID } from '../common';
import { OLLayerVectorComponent } from './ol-layer-vector';
import { OLMapComponent } from './ol-map';
import { Mapable } from './ol-mapable';
import { MapableComponent } from './ol-mapable';
import { Selector } from './ol-selector';
import { SelectorComponent } from './ol-selector';

import * as Comlink from 'comlink';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { OnDestroy } from '@angular/core';
import { OnInit } from '@angular/core';
import { EventsKey as OLEventsKey } from 'ol/events';
import { SelectEvent as OLSelectEvent } from 'ol/interaction/Select';

import { forwardRef } from '@angular/core';
import { inject } from '@angular/core';
import { input } from '@angular/core';
import { output } from '@angular/core';
import { unByKey } from 'ol/Observable';
import { click } from 'ol/events/condition';
import { never } from 'ol/events/condition';
import { platformModifierKeyOnly } from 'ol/events/condition';
import { shiftKeyOnly } from 'ol/events/condition';
import { extend } from 'ol/extent';
import { transformExtent } from 'ol/proj';

import Debounce from 'debounce-decorator';
import OLFeature from 'ol/Feature';
import OLGeoJSON from 'ol/format/GeoJSON';
import OLSelect from 'ol/interaction/Select';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: MapableComponent,
      useExisting: forwardRef(() => OLInteractionSelectParcelsComponent)
    },
    {
      provide: SelectorComponent,
      useExisting: forwardRef(() => OLInteractionSelectParcelsComponent)
    }
  ],
  selector: 'app-ol-interaction-selectparcels',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLInteractionSelectParcelsComponent
  implements Mapable, OnDestroy, OnInit, Selector
{
  abutters: Parcel[] = [];
  abuttersFound = output<Parcel[]>();
  featuresSelected = output<OLFeature<any>[]>();
  findAbutters = input(false);

  // 👉 we need public access to go through the selector to its layer
  //    see abstract-map.ts -- this is how the context menu works
  //    the layer that contains the selector contains the features
  //    that can be operated on

  layer = inject(OLLayerVectorComponent);
  map = inject(OLMapComponent);

  maxZoom = input(19);
  olSelect: OLSelect;
  zoomAnimationDuration = input(200);

  #abuttersWorker: any /* 👈 TypeScript no help here */;
  #featuresLoadEndKey: OLEventsKey;
  #format: OLGeoJSON;
  #selectKey: OLEventsKey;

  constructor() {
    this.olSelect = new OLSelect({
      addCondition: (event): boolean => click(event) && shiftKeyOnly(event),
      condition: (event): boolean => click(event),
      layers: [this.layer.olLayer],
      multi: true,
      removeCondition: (event): boolean =>
        click(event) && platformModifierKeyOnly(event),
      style: this.layer.styleWhenSelected(),
      toggleCondition: (): boolean => never()
    });
    this.olSelect.setProperties({ component: this }, true);
    // 👉 one to rule them all
    this.#format = new OLGeoJSON({
      dataProjection: this.map.featureProjection,
      featureProjection: this.map.projection
    });
  }

  get abutterIDs(): ParcelID[] {
    return this.abutters.map((feature) => feature.id);
  }

  get selected(): OLFeature<any>[] {
    return this.olSelect.getFeatures().getArray();
  }

  get selectedIDs(): ParcelID[] {
    return this.selected.map((feature) => feature.getId());
  }

  @Debounce(250) selectParcels(parcels: Parcel[]): void {
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
    // 👇 zoom to the extent of all the selected parcels and select them
    const minZoom = this.map.olView.getMinZoom();
    this.map.olView.setMinZoom(this.map.minUsefulZoom());
    this.map.olView.fit(extent, {
      callback: () => {
        this.map.olView.setMinZoom(minZoom);
        this.#selectParcels(ids);
      },
      duration: this.zoomAnimationDuration(),
      maxZoom: this.maxZoom() ?? this.map.maxZoom(),
      size: this.map.olMap.getSize()
    });
  }

  addToMap(): void {
    this.map.olMap.addInteraction(this.olSelect);
  }

  ngOnDestroy(): void {
    if (this.#selectKey) unByKey(this.#selectKey);
    if (this.#featuresLoadEndKey) unByKey(this.#featuresLoadEndKey);
  }

  ngOnInit(): void {
    if (this.findAbutters()) this.#createAbuttersWorker();
    this.#selectKey = this.olSelect.on('select', this.#onSelect.bind(this));
  }

  reselectParcels(ids: ParcelID[]): void {
    this.#selectParcels(ids);
  }

  unselectParcels(): void {
    this.#selectParcels([]);
  }

  #createAbuttersWorker(): void {
    const proxy: any = Comlink.wrap(
      new Worker(new URL('../../../worker/src/abutters', import.meta.url))
    );
    new proxy().then((instance) => (this.#abuttersWorker = instance));
  }

  #findAbutters(): void {
    const selecteds = this.selected.map((feature) =>
      JSON.parse(this.#format.writeFeature(feature))
    );
    const allFeatures = this.layer.olLayer
      .getSource()
      .getFeatures()
      .map((feature) => JSON.parse(this.#format.writeFeature(feature)));
    this.abutters = [];
    // 👉 all this happens asynchronously in a web worker
    this.#abuttersWorker?.find(selecteds, allFeatures).then((abutters) => {
      // 👉 jank-free repaint of abutter features
      const source = this.layer.olLayer.getSource();
      abutters.forEach((abutter) =>
        source.getFeatureById(abutter.id).changed()
      );
      // 👉 propgate abutters
      this.abutters = abutters;
      this.abuttersFound.emit(abutters);
    });
  }

  #hasSelectionChanged(ids: ParcelID[]): boolean {
    const diff = new Set(this.selectedIDs);
    if (ids.length !== diff.size) return true;
    for (const id of ids) diff.delete(id);
    return diff.size > 0;
  }

  #onSelect(_event?: OLSelectEvent): void {
    const ids = this.selectedIDs.join(', ');
    console.log(`%cSelected parcels`, 'color: lightcoral', `[${ids}]`);
    this.featuresSelected.emit(this.selected);
    // 👉 find the abutters
    if (this.findAbutters()) this.#findAbutters();
  }

  #selectParcels(ids: ParcelID[]): void {
    const delta = this.#hasSelectionChanged(ids);
    this.olSelect.getFeatures().clear();
    this.layer.olLayer.getSource().forEachFeature((feature) => {
      if (ids.includes(feature.getId()))
        this.olSelect.getFeatures().push(feature);
    });
    // 👉 ony push an event if the selection has changed
    //    OL will reselect when features come in and out of view,
    //    so we need to jump through all the other hoops
    if (delta) this.#onSelect();
  }
}
