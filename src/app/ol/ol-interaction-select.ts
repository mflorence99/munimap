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
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLInteractionSelectComponent
  implements AfterContentInit, Mapable, OnDestroy
{
  @Input() eventType: string;

  @Output() featuresSelected = new EventEmitter<OLFeature<any>[]>();

  @Input() filter: FilterFunction;

  @Input() multi = false;

  olSelect: OLSelect;

  @Input() zoomAnimationDuration = 200;

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

  #onSelect(_event: OLSelectEvent): void {
    this.featuresSelected.emit(this.olSelect.getFeatures().getArray());
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
    });
    // 👇 zoom to the extent of all the selected  parcels
    this.map.olView.fit(extent, {
      duration: this.zoomAnimationDuration,
      maxZoom: this.map.maxZoom,
      size: this.map.olMap.getSize()
    });
  }
}
