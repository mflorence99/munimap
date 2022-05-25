import { LandmarkID } from '../../common';
import { Mapable } from '../ol-mapable';
import { MapableComponent } from '../ol-mapable';
import { OLLayerVectorComponent } from '../ol-layer-vector';
import { OLMapComponent } from '../ol-map';
import { Selector } from '../ol-selector';
import { SelectorComponent } from '../ol-selector';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { EventEmitter } from '@angular/core';
import { EventsKey as OLEventsKey } from 'ol/events';
import { Input } from '@angular/core';
import { OnDestroy } from '@angular/core';
import { OnInit } from '@angular/core';
import { Output } from '@angular/core';
import { SelectEvent as OLSelectEvent } from 'ol/interaction/Select';
import { StyleFunction as OLStyleFunction } from 'ol/style/Style';

import { click } from 'ol/events/condition';
import { forwardRef } from '@angular/core';
import { never } from 'ol/events/condition';
import { platformModifierKeyOnly } from 'ol/events/condition';
import { pointerMove } from 'ol/events/condition';
import { shiftKeyOnly } from 'ol/events/condition';
import { unByKey } from 'ol/Observable';

import OLFeature from 'ol/Feature';
import OLLayer from 'ol/layer/Layer';
import OLSelect from 'ol/interaction/Select';
import OLStyle from 'ol/style/Style';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: MapableComponent,
      useExisting: forwardRef(() => OLInteractionSelectLandmarksComponent)
    },
    {
      provide: SelectorComponent,
      useExisting: forwardRef(() => OLInteractionSelectLandmarksComponent)
    }
  ],
  selector: 'app-ol-interaction-selectlandmarks',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLInteractionSelectLandmarksComponent
  implements Mapable, OnDestroy, OnInit, Selector
{
  #selectKey: OLEventsKey;

  @Output() featuresSelected = new EventEmitter<OLFeature<any>[]>();

  @Input() layers: OLLayerVectorComponent[];

  @Input() multi: boolean;

  olHover: OLSelect;
  olSelect: OLSelect;

  // 👉 selection is read-only if any feature is drawn from any layer
  //    which is not the primary layer
  get roSelection(): boolean {
    return this.selected.some(
      (feature) => this.olSelect.getLayer(feature) !== this.layer.olLayer
    );
  }

  get selected(): OLFeature<any>[] {
    return this.olSelect.getFeatures().getArray();
  }

  get selectedIDs(): any[] {
    return this.selected.map((feature) => feature.getId());
  }

  constructor(
    // 👉 we need public access to go through the selector to its layer
    //    see abstract-map.ts -- this is how the context menu works
    //    the layer that contains the selector contains the features
    //    that can be operated on
    public layer: OLLayerVectorComponent,
    private map: OLMapComponent
  ) {
    const whichLayers = (olLayer: OLLayer): boolean => {
      const layers = this.layers ?? [this.layer];
      return layers.some((layer) => layer.olLayer === olLayer);
    };
    // 👉 for hovering
    this.olHover = new OLSelect({
      condition: (event): boolean => pointerMove(event),
      // 👇 don't hover over something that's already selected
      filter: (feature): boolean => !this.selectedIDs.includes(feature.getId()),
      layers: whichLayers,
      style: this.#styleWhenHovering()
    });
    this.olHover.setProperties({ component: this }, true);
    // 👉 for selecting
    this.olSelect = new OLSelect({
      addCondition: (event): boolean =>
        this.multi ? click(event) && shiftKeyOnly(event) : never(),
      condition: (event): boolean => click(event),
      layers: whichLayers,
      multi: this.multi,
      removeCondition: (event): boolean =>
        this.multi ? click(event) && platformModifierKeyOnly(event) : never(),
      style: this.#styleWhenSelected(),
      toggleCondition: (): boolean => never()
    });
    this.olSelect.setProperties({ component: this }, true);
  }

  #hasSelectionChanged(ids: LandmarkID[]): boolean {
    const diff = new Set(this.selectedIDs);
    if (ids.length !== diff.size) return true;
    for (const id of ids) diff.delete(id);
    return diff.size > 0;
  }

  #onSelect(_event?: OLSelectEvent): void {
    const names = this.selected.map((selected) => selected.getId()).join(', ');
    console.log(`%cSelected landmarks`, 'color: lightcoral', `[${names}]`);
    this.featuresSelected.emit(this.selected);
  }

  #styleWhenHovering(): OLStyleFunction {
    return (feature: any, resolution: number): OLStyle[] => {
      const layer: OLLayerVectorComponent = this.olHover
        .getLayer(feature)
        .get('component');
      return layer?.styleWhenHovering?.()(feature, resolution) as OLStyle[];
    };
  }

  #styleWhenSelected(): OLStyleFunction {
    return (feature: any, resolution: number): OLStyle[] => {
      const layer: OLLayerVectorComponent = this.olSelect
        .getLayer(feature)
        .get('component');
      return layer?.styleWhenSelected?.()(feature, resolution) as OLStyle[];
    };
  }

  addToMap(): void {
    this.map.olMap.addInteraction(this.olHover);
    this.map.olMap.addInteraction(this.olSelect);
  }

  ngOnDestroy(): void {
    if (this.#selectKey) unByKey(this.#selectKey);
  }

  ngOnInit(): void {
    this.#selectKey = this.olSelect.on('select', this.#onSelect.bind(this));
  }

  reselectLandmarks(ids: LandmarkID[]): void {
    this.selectLandmarks(ids);
  }

  selectLandmarks(ids: LandmarkID[]): void {
    const delta = this.#hasSelectionChanged(ids);
    this.olSelect.getFeatures().clear();
    const layers = this.layers ?? [this.layer];
    layers.forEach((layer) => {
      layer.olLayer.getSource().forEachFeature((feature) => {
        if (ids.includes(feature.getId()))
          this.olSelect.getFeatures().push(feature);
      });
    });
    // 👉 only push an event if the selection has changed
    //    OL will reselect when features come in and out of view,
    //    so we need to jump through all the other hoops
    if (delta) this.#onSelect();
  }

  unselectLandmarks(): void {
    this.selectLandmarks([]);
  }
}
