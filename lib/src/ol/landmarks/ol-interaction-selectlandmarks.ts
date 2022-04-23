import { DestroyService } from '../../services/destroy';
import { Mapable } from '../ol-mapable';
import { MapableComponent } from '../ol-mapable';
import { OLLayerVectorComponent } from '../ol-layer-vector';
import { OLMapComponent } from '../ol-map';
import { Selector } from '../ol-selector';
import { SelectorComponent } from '../ol-selector';

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

import { forwardRef } from '@angular/core';
import { takeUntil } from 'rxjs/operators';
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
    },
    DestroyService
  ],
  selector: 'app-ol-interaction-selectlandmarks',
  templateUrl: './ol-interaction-selectlandmarks.html',
  styleUrls: ['./ol-interaction-selectlandmarks.scss']
})
export class OLInteractionSelectLandmarksComponent
  implements Mapable, OnDestroy, OnInit, Selector
{
  #selectKey: OLEventsKey;

  @ContentChild(MatMenu) contextMenu: MatMenu;
  @ViewChild(MatMenuTrigger) contextMenuTrigger: MatMenuTrigger;

  @Output() featuresSelected = new EventEmitter<OLFeature<any>[]>();

  @Input() set hitTolerance(tolerance: number) {
    this.olSelect.setHitTolerance(tolerance);
  }

  menuPosition = {
    x: 0,
    y: 0
  };

  olSelect: OLSelect;

  get selected(): OLFeature<any>[] {
    return this.olSelect.getFeatures().getArray();
  }

  get selectedIDs(): any[] {
    return this.selected.map((feature) => feature.getId());
  }

  @Input() type: 'hover' | 'select';

  constructor(
    private cdf: ChangeDetectorRef,
    private destroy$: DestroyService,
    // 👉 we need public access to go through the selector to its layer
    public layer: OLLayerVectorComponent,
    private map: OLMapComponent
  ) {}

  // 🔥 SIMILAR is in ol-interaction-selectparcels -- refactor ??

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
              // 👇 single selection ONLY !!
              this.olSelect.getFeatures().clear();
              this.olSelect.getFeatures().push(feature);
              this.featuresSelected.emit(this.selected);
            }
          };
          this.map.olMap.forEachFeatureAtPixel(pixel, cb);
          // 👉 because event is triggered out of the Angular zone
          this.cdf.markForCheck();
          this.contextMenuTrigger.openMenu();
        }
      });
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
    // 👇 only process context menu on select, not on hover
    if (this.type === 'select') this.#handleContextMenu$();
  }
}
