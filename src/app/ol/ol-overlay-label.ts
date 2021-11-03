import { AddParcels } from '../state/parcels';
import { AuthState } from '../state/auth';
import { DestroyService } from '../services/destroy';
import { OLMapComponent } from './ol-map';
import { Parcel } from '../state/parcels';
import { ParcelProperties } from '../state/parcels';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { ElementRef } from '@angular/core';
import { OnInit } from '@angular/core';
import { Store } from '@ngxs/store';
import { ViewChild } from '@angular/core';

import { fromLonLat } from 'ol/proj';
import { takeUntil } from 'rxjs/operators';
import { toLonLat } from 'ol/proj';

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
  @ViewChild('label', { static: true }) label: ElementRef<HTMLDivElement>;

  olFeature: OLFeature<any>;
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

  ngOnInit(): void {
    this.olOverlay.setElement(this.label.nativeElement);
    this.#handleClick$();
  }

  onDragEnd(event: DragEvent): void {
    // 👉 need to hack the Y offset by the height of the toolbar
    const style = getComputedStyle(document.documentElement);
    const hack = style.getPropertyValue('--map-cy-toolbar');
    // construct a parcel to override the label position
    const parcel: Parcel = {
      id: this.olFeature.getId(),
      owner: this.authState.currentProfile().email,
      path: this.map.path,
      properties: {
        center: toLonLat(
          this.map.olMap.getCoordinateFromPixel([
            event.clientX,
            event.clientY - Number(hack)
          ])
        )
      } as ParcelProperties,
      type: 'Feature'
    };
    this.store.dispatch(new AddParcels([parcel]));
    this.olOverlay.setPosition([0, 0]);
  }

  setFeature(feature: OLFeature<any>): void {
    this.olFeature = feature;
    this.olOverlay.setPosition(fromLonLat(feature.getProperties().center));
  }
}
