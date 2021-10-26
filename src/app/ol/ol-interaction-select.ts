import { Mapable } from './ol-mapable';
import { MapableComponent } from './ol-mapable';
import { OLLayerVectorComponent } from './ol-layer-vector';
import { OLMapComponent } from './ol-map';

import { AfterContentInit } from '@angular/core';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { EventEmitter } from '@angular/core';
import { Input } from '@angular/core';
import { OnDestroy } from '@angular/core';
import { Output } from '@angular/core';
import { SelectEvent as OLSelectEvent } from 'ol/interaction/Select';

import { createEmpty } from 'ol/extent';
import { extend } from 'ol/extent';
import { forwardRef } from '@angular/core';

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
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLInteractionSelectComponent
  implements AfterContentInit, Mapable, OnDestroy
{
  @Input() eventType: string;

  @Output() featuresSelected = new EventEmitter<OLFeature<any>[]>();

  @Input() filter: FilterFunction;

  olSelect: OLSelect;

  @Input() zoomAnimationDuration = 500;

  constructor(
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

  #onSelect(event: OLSelectEvent): void {
    this.featuresSelected.emit(event.selected);
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

  selectFeatures(features: OLFeature<any>[]): void {
    this.olSelect.getFeatures().clear();
    const extent = createEmpty();
    // 👉 select supplied features
    features.forEach((feature) => {
      extend(extent, feature.getGeometry().getExtent());
      this.olSelect.getFeatures().push(feature);
    });
    // 👉 center the map so all are visible
    this.map.olView.fit(extent, {
      duration: this.zoomAnimationDuration,
      maxZoom: this.map.maxZoom,
      size: this.map.olMap.getSize()
    });
  }

  selectFeaturesFromProps(props: Record<string, any>[], key = 'id'): void {
    const features: OLFeature<any>[] = [];
    const ids = props.map((prop) => prop[key]);
    this.layer.olLayer.getSource().forEachFeature((feature) => {
      const props = feature.getProperties();
      if (ids.includes(props[key])) features.push(feature);
    });
    this.selectFeatures(features);
  }
}
