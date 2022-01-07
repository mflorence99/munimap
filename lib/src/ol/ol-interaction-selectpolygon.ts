import { Mapable } from './ol-mapable';
import { MapableComponent } from './ol-mapable';
import { OLLayerVectorComponent } from './ol-layer-vector';
import { OLMapComponent } from './ol-map';

import { ChangeDetectionStrategy } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { Component } from '@angular/core';
import { EventEmitter } from '@angular/core';
import { EventsKey as OLEventsKey } from 'ol/events';
import { Input } from '@angular/core';
import { OnDestroy } from '@angular/core';
import { OnInit } from '@angular/core';
import { Output } from '@angular/core';
import { SelectEvent as OLSelectEvent } from 'ol/interaction/Select';

import { forwardRef } from '@angular/core';
import { unByKey } from 'ol/Observable';

import OLFeature from 'ol/Feature';
import OLSelect from 'ol/interaction/Select';

export type FilterFunction = (feature: OLFeature<any>) => boolean;

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: MapableComponent,
      useExisting: forwardRef(() => OLInteractionSelectPolygonComponent)
    }
  ],
  selector: 'app-ol-interaction-selectpolygon',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLInteractionSelectPolygonComponent
  implements Mapable, OnDestroy, OnInit
{
  #selectKey: OLEventsKey;

  @Input() eventType: string;

  @Output() featuresSelected = new EventEmitter<OLFeature<any>[]>();

  @Input() filter: FilterFunction;

  olSelect: OLSelect;

  get selected(): OLFeature<any>[] {
    return this.olSelect.getFeatures().getArray();
  }

  get selectedIDs(): any[] {
    return this.selected.map((feature) => feature.getId());
  }

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

  ngOnDestroy(): void {
    if (this.#selectKey) unByKey(this.#selectKey);
  }

  ngOnInit(): void {
    this.#selectKey = this.olSelect.on('select', this.#onSelect.bind(this));
  }
}
