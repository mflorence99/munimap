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
import { StyleFunction as OLStyleFunction } from 'ol/style/Style';

import OLSelect from 'ol/interaction/Select';
import OLStyle from 'ol/style/Style';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-interaction-select',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLInteractionSelectComponent
  implements AfterContentInit, OnDestroy
{
  #olStyle: OLStyle;

  @Input() eventType: string;

  olSelect: OLSelect;
  olStyleable: OLInteractionSelectComponent;

  @Output('select') select = new EventEmitter<string>();

  @Input() styler: OLStyleFunction;

  constructor(
    private layer: OLLayerVectorComponent,
    private map: OLMapComponent
  ) {
    // 👇 we can't follow the usual convention because there's
    //    no way to setStyle() so we defer creation -- see below
    this.olStyleable = this;
  }

  #onSelect(event: OLSelectEvent): void {
    this.select.emit(event.selected[0]?.getId());
  }

  ngAfterContentInit(): void {
    // 👇 we can't follow the usual convention because there's
    //    no way to setStyle()
    this.olSelect = new OLSelect({
      condition: (event): boolean =>
        event.type === this.eventType.toLowerCase(),
      layers: [this.layer.olLayer],
      style: this.styler ?? this.#olStyle
    });
    this.olSelect.on('select', this.#onSelect.bind(this));
    this.map.olMap.addInteraction(this.olSelect);
  }

  ngOnDestroy(): void {
    this.olSelect.un('select', this.#onSelect.bind(this));
  }

  setStyle(olStyle: OLStyle): void {
    this.#olStyle = olStyle;
  }
}
