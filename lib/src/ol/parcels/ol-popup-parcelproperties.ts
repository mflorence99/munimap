import { OLInteractionSelectParcelsComponent } from './ol-interaction-selectparcels';
import { OLMapComponent } from '../ol-map';
import { OLPopupSelectionComponent } from '../ol-popup-selection';
import { Parcel } from '../../common';
import { ParcelID } from '../../common';
import { ParcelProperties } from '../../common';

import { parcelPropertiesUsage } from '../../common';
import { parcelPropertiesUse } from '../../common';

import { ChangeDetectionStrategy } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { Component } from '@angular/core';
import { ElementRef } from '@angular/core';
import { Input } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { ViewChild } from '@angular/core';

import { map } from 'rxjs/operators';

import OLFeature from 'ol/Feature';

// 👇 we can't use the normal DestroyService protocol here
//    as snackbar popups don't have a standard lifecycle
//    when created via openFromTemplate

interface Abutter {
  address: string;
  id: ParcelID;
  owner: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-popup-parcelproperties',
  templateUrl: './ol-popup-parcelproperties.html',
  styleUrls: ['../ol-popup-selection.scss', './ol-popup-parcelproperties.scss']
})
export class OLPopupParcelPropertiesComponent {
  #subToAbutters: Subscription;
  #subToSelection: Subscription;

  abutters: Abutter[] = [];

  @Input() maxNumProperties = 3;

  parcelPropertiesUsage = parcelPropertiesUsage;
  parcelPropertiesUse = parcelPropertiesUse;

  properties: ParcelProperties[] = [];

  sameAddress: boolean;
  sameOwner: boolean;
  sameUsage: boolean;

  splitHorizontally = false;
  splitVertically = true;

  @ViewChild('tables', { static: true }) tables: ElementRef;

  constructor(
    private cdf: ChangeDetectorRef,
    private map: OLMapComponent,
    private popper: OLPopupSelectionComponent,
    private snackBar: MatSnackBar
  ) {
    // 👉 see above, no ngOnInit where we'd normally do this
    this.#handleAbuttersFound$();
    this.#handleFeaturesSelected$();
  }

  #handleAbuttersFound$(): void {
    /* 🔥 this.#subToAbutters = */ this.map.abuttersFound
      .pipe(
        map((features: Parcel[]): Abutter[] =>
          features
            .map((feature) => ({
              address: feature.properties.address,
              id: feature.id,
              owner: feature.properties.owner
            }))
            .sort((p, q) => String(p.id).localeCompare(String(q.id)))
        ),
        // 👉 only show abutters if there's room
        map((abutters: Abutter[]): Abutter[] =>
          window.innerWidth >= 480 ? abutters : []
        )
      )
      .subscribe((abutters: Abutter[]) => {
        this.abutters = abutters;
        this.cdf.markForCheck();
      });
  }

  #handleFeaturesSelected$(): void {
    /* 🔥 this.#subToSelection = */ this.map.featuresSelected
      .pipe(
        map((features: OLFeature<any>[]): ParcelProperties[] =>
          features.map((feature) => feature.getProperties())
        ),
        // 👉 show only as many properties as there's room
        map((properties: ParcelProperties[]): ParcelProperties[] => {
          const numProperties = window.innerWidth / 240;
          return properties.slice(
            0,
            Math.min(properties.length, numProperties, this.maxNumProperties)
          );
        })
      )
      .subscribe((properties: ParcelProperties[]) => {
        this.properties = properties;
        if (this.properties.length === 0) this.onClose();
        else {
          this.sameAddress = this.properties.every(
            (property) => property.address === this.properties[0].address
          );
          this.sameOwner = this.properties.every(
            (property) => property.owner === this.properties[0].owner
          );
          this.sameUsage = this.properties.every(
            (property) =>
              property.usage === this.properties[0].usage &&
              property.use === this.properties[0].use
          );
          // 👉 split depending on # of parcels
          this.splitHorizontally = this.properties.length > 1;
          this.splitVertically = this.properties.length === 1;
          this.cdf.markForCheck();
        }
      });
  }

  canClipboard(): boolean {
    return this.popper.canClipboard();
  }

  // 👉 https://developers.google.com/maps/documentation/urls/get-started
  googleLink(property: ParcelProperties): string {
    const link = `https://www.google.com/maps/@?api=1&map_action=map&center=${
      property.centers[0][1]
    }%2C${property.centers[0][0]}&zoom=${Math.round(
      this.map.olView.getZoom()
    )}&basemap=satellite`;
    return link;
  }

  onClipboard(): void {
    this.popper.toClipboard(this.tables);
  }

  onClose(): void {
    this.snackBar.dismiss();
    // 👉 the selector MAY not be present and may not be for parcels
    const selector = this.map.selector as OLInteractionSelectParcelsComponent;
    selector?.unselectParcels?.();
    // 🔥  this doesn't seem to work
    // this.#subToAbutters?.unsubscribe();
    // this.#subToSelection?.unsubscribe();
  }

  onSelect(abutterID: ParcelID): void {
    // 👉 the selector MAY not be present and may not be for parcels
    const selector = this.map.selector as OLInteractionSelectParcelsComponent;
    selector?.reselectParcels?.([abutterID]);
  }

  sum(array: number[]): number {
    return array.reduce((acc, val) => acc + val);
  }
}
