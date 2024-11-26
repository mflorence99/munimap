import { Mapable } from './ol-mapable';
import { MapableComponent } from './ol-mapable';
import { OLLayerVectorComponent } from './ol-layer-vector';
import { OLMapComponent } from './ol-map';
import { Selector } from './ol-selector';
import { SelectorComponent } from './ol-selector';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { EventsKey as OLEventsKey } from 'ol/events';
import { OnDestroy } from '@angular/core';
import { OnInit } from '@angular/core';
import { SelectEvent as OLSelectEvent } from 'ol/interaction/Select';

import { click } from 'ol/events/condition';
import { forwardRef } from '@angular/core';
import { inject } from '@angular/core';
import { input } from '@angular/core';
import { output } from '@angular/core';
import { pointerMove } from 'ol/events/condition';
import { unByKey } from 'ol/Observable';

import OLFeature from 'ol/Feature';
import OLSelect from 'ol/interaction/Select';

export type FilterFunction = (name: number | string) => boolean;

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: MapableComponent,
      useExisting: forwardRef(() => OLInteractionSelectGeoJSONComponent)
    },
    {
      provide: SelectorComponent,
      useExisting: forwardRef(() => OLInteractionSelectGeoJSONComponent)
    }
  ],
  selector: 'app-ol-interaction-selectgeojson',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }'],
  standalone: false
})
export class OLInteractionSelectGeoJSONComponent
  implements Mapable, OnDestroy, OnInit, Selector
{
  featuresSelected = output<OLFeature<any>[]>();
  filter = input<FilterFunction>();

  // 👉 we need public access to go through the selector to its layer
  //    see abstract-map.ts -- this is how the context menu works
  //    the layer that contains the selector contains the features
  //    that can be operated on

  layer = inject(OLLayerVectorComponent);
  map = inject(OLMapComponent);

  olHover: OLSelect;
  olSelect: OLSelect;

  #selectKey: OLEventsKey;

  constructor() {
    // 👉 for hovering
    this.olHover = new OLSelect({
      condition: (event): boolean => pointerMove(event),
      filter: this.#filter.bind(this),
      layers: [this.layer.olLayer],
      style: this.layer.styleWhenHovering()
    });
    this.olHover.setProperties({ component: this }, true);
    // 👉 for selecting
    this.olSelect = new OLSelect({
      condition: (event): boolean => click(event),
      filter: this.#filter.bind(this),
      layers: [this.layer.olLayer],
      style: this.layer.styleWhenSelected()
    });
    this.olSelect.setProperties({ component: this }, true);
  }

  get selected(): OLFeature<any>[] {
    return this.olSelect.getFeatures().getArray();
  }

  get selectedIDs(): any[] {
    return this.selected.map((feature) => feature.getId());
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

  #filter(feature: OLFeature<any>): boolean {
    return this.filter() ? this.filter()(feature.getId()) : true;
  }

  #onSelect(_event?: OLSelectEvent): void {
    const ids = this.selectedIDs.join(', ');
    console.log(`%cSelected features`, 'color: lightcoral', `[${ids}]`);
    this.featuresSelected.emit(this.selected);
  }
}
