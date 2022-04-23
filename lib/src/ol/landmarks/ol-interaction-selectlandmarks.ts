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

import { forwardRef } from '@angular/core';
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

  @Input() set hitTolerance(tolerance: number) {
    this.olSelect.setHitTolerance(tolerance);
  }

  olSelect: OLSelect;

  get selected(): OLFeature<any>[] {
    return this.olSelect.getFeatures().getArray();
  }

  get selectedIDs(): any[] {
    return this.selected.map((feature) => feature.getId());
  }

  @Input() type: 'hover' | 'select';

  constructor(
    private layer: OLLayerVectorComponent,
    private map: OLMapComponent
  ) {}

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
    // 👇 we can't do this in the constructor because the type isn't set
    this.olSelect = new OLSelect({
      condition: (event): boolean => {
        let eventType;
        if (this.type === 'hover') eventType = 'pointermove';
        else if (this.type === 'select') eventType = 'click';
        return event.type === eventType;
      },
      layers: [this.layer.olLayer],
      style:
        this.type === 'hover'
          ? this.layer.styleWhenHovering()
          : this.type === 'select'
          ? this.layer.styleWhenSelected()
          : undefined
    });
    // only fire on select, not hover
    if (this.type === 'select')
      this.#selectKey = this.olSelect.on('select', this.#onSelect.bind(this));
  }
}
