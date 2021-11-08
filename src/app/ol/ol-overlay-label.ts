import { AddParcels } from '../state/parcels';
import { AuthState } from '../state/auth';
import { DestroyService } from '../services/destroy';
import { OLMapComponent } from './ol-map';
import { Parcel } from '../common';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { ElementRef } from '@angular/core';
import { OnInit } from '@angular/core';
import { Store } from '@ngxs/store';
import { ViewChild } from '@angular/core';

import { fromLonLat } from 'ol/proj';
import { point } from '@turf/helpers';
import { polygon } from '@turf/helpers';
import { takeUntil } from 'rxjs/operators';
import { toLonLat } from 'ol/proj';

import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import OLFeature from 'ol/Feature';
import OLOverlay from 'ol/Overlay';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DestroyService],
  selector: 'app-ol-overlay-label',
  templateUrl: './ol-overlay-label.html',
  styleUrls: ['./ol-overlay-label.scss']
})
export class OLOverlayLabelComponent implements OnInit {
  #centers: number[][];
  #contextMenuAt: number[];
  #hack: number;
  #id: string;
  #ix: number;

  @ViewChild('label', { static: true }) label: ElementRef<HTMLDivElement>;

  olOverlay: OLOverlay;

  constructor(
    private authState: AuthState,
    private destroy$: DestroyService,
    private map: OLMapComponent,
    private store: Store
  ) {
    this.olOverlay = new OLOverlay({
      position: [0, 0],
      positioning: 'center-center'
    });
    map.olMap.addOverlay(this.olOverlay);
  }

  #handleClick$(): void {
    this.map.click$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.olOverlay.setPosition([0, 0]));
  }

  #handleContextMenu$(): void {
    this.map.contextMenu$.pipe(takeUntil(this.destroy$)).subscribe((event) => {
      this.#contextMenuAt = this.map.olMap.getCoordinateFromPixel([
        event.clientX,
        event.clientY - this.#hack
      ]);
    });
  }

  ngOnInit(): void {
    // 👉 need to hack Y offsets by the height of the toolbar
    const style = getComputedStyle(document.documentElement);
    this.#hack = Number(style.getPropertyValue('--map-cy-toolbar'));
    this.olOverlay.setElement(this.label.nativeElement);
    this.#handleClick$();
    this.#handleContextMenu$();
  }

  onDragEnd(event: DragEvent): void {
    // 👉 construct a parcel to override the label position
    const centers = this.#centers;
    centers[this.#ix] = toLonLat(
      this.map.olMap.getCoordinateFromPixel([
        event.clientX,
        event.clientY - this.#hack
      ])
    );
    const parcel: Parcel = {
      id: this.#id,
      owner: this.authState.currentProfile().email,
      path: this.map.path,
      properties: {
        centers: centers
      },
      type: 'Feature'
    };
    this.store.dispatch(new AddParcels([parcel]));
    this.olOverlay.setPosition([0, 0]);
  }

  setFeature(feature: OLFeature<any>): void {
    this.#centers = feature.getProperties().centers;
    this.#id = `${feature.getId()}`;
    this.#ix = 0;
    if (feature.getGeometry().getType() === 'MultiPolygon') {
      const polygons = feature.getGeometry().getPolygons();
      for (this.#ix = 0; this.#ix < polygons.length; this.#ix++) {
        const pt = point(this.#contextMenuAt);
        const poly = polygon([polygons[this.#ix].getCoordinates()[0]]);
        if (booleanPointInPolygon(pt, poly)) break;
      }
    }
    this.olOverlay.setPosition(fromLonLat(this.#centers[this.#ix]));
  }
}
