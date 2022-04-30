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
import { OnDestroy } from '@angular/core';
import { OnInit } from '@angular/core';
import { Output } from '@angular/core';
import { SelectEvent as OLSelectEvent } from 'ol/interaction/Select';

import { click } from 'ol/events/condition';
import { forwardRef } from '@angular/core';
import { never } from 'ol/events/condition';
import { platformModifierKeyOnly } from 'ol/events/condition';
import { pointerMove } from 'ol/events/condition';
import { shiftKeyOnly } from 'ol/events/condition';
import { unByKey } from 'ol/Observable';

import OLFeature from 'ol/Feature';
import OLSelect from 'ol/interaction/Select';

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

  olHover: OLSelect;
  olSelect: OLSelect;

  get selected(): OLFeature<any>[] {
    return this.olSelect.getFeatures().getArray();
  }

  get selectedIDs(): any[] {
    return this.selected.map((feature) => feature.getId());
  }

  constructor(
    // 👉 we need public access to go through the selector to its layer
    public layer: OLLayerVectorComponent,
    private map: OLMapComponent
  ) {
    this.olHover = new OLSelect({
      condition: (event): boolean => pointerMove(event),
      // 👇 don't hover over something that's already selected
      filter: (feature): boolean => !this.selectedIDs.includes(feature.getId()),
      layers: [this.layer.olLayer],
      style: this.layer.styleWhenHovering()
    });
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
  }

  #hasSelectionChanged(ids: LandmarkID[]): boolean {
    const diff = new Set(this.selectedIDs);
    if (ids.length !== diff.size) return true;
    for (const id of ids) diff.delete(id);
    return diff.size > 0;
  }

  #onSelect(_event?: OLSelectEvent): void {
    const names = this.selected
      .map((selected) => selected.get('name'))
      .join(', ');
    console.log(`%cSelected landmarks`, 'color: lightcoral', `[${names}]`);
    this.featuresSelected.emit(this.selected);
  }

  #selectLandmarks(ids: LandmarkID[]): void {
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
    this.#selectLandmarks(ids);
  }
}
