import { Feature } from '../geojson';
import { OLMapComponent } from './ol-map';
import { ParcelID } from '../geojson';
import { ParcelProperties } from '../geojson';
import { TypeRegistry } from '../services/typeregistry';

import { ChangeDetectionStrategy } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { Component } from '@angular/core';
import { ElementRef } from '@angular/core';
import { Input } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { ViewChild } from '@angular/core';

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
  styleUrls: ['./ol-popup-parcelproperties.scss']
})
export class OLPopupParcelPropertiesComponent {
  #subToAbutters: Subscription;
  #subToSelection: Subscription;

  abutters: Abutter[] = [];

  @Input() maxNumProperties = 3;

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
    public registry: TypeRegistry,
    private snackBar: MatSnackBar
  ) {
    // 👉 see above, no ngOnInit where we'd normally do this
    this.#handleAbuttersFound$();
    this.#handleFeaturesSelected$();
  }

  #handleAbuttersFound$(): void {
    this.#subToAbutters = this.map.selector?.abuttersFound.subscribe(
      (features: Feature[]) => {
        this.abutters = features
          .map((feature) => ({
            address: feature.properties.address,
            id: feature.id,
            owner: feature.properties.owner
          }))
          .sort((p, q) => String(p.id).localeCompare(String(q.id)));
        this.cdf.markForCheck();
      }
    );
  }

  #handleFeaturesSelected$(): void {
    this.#subToSelection = this.map.selector?.featuresSelected.subscribe(
      (features: OLFeature<any>[]) => {
        this.properties = features.map((feature) => feature.getProperties());
        this.properties.length = Math.min(
          this.properties.length,
          this.maxNumProperties
        );
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
      }
    );
  }

  canClipboard(): boolean {
    return !!navigator.clipboard?.write;
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
    const type = 'text/html';
    // 👉 get type mismatch error w/o any, contradicting the MDN example
    //    https://developer.mozilla.org/en-US/docs/Web/API/ClipboardItem
    const data = [
      new ClipboardItem({
        [type]: new Blob([this.tables.nativeElement.innerHTML], {
          type
        }) as any
      })
    ];
    navigator.clipboard
      .write(data)
      .then(() =>
        console.log(
          '%cParcelProperties and Abutters copied to clipboard',
          'color: khaki'
        )
      );
  }

  onClose(): void {
    this.snackBar.dismiss();
    this.#subToAbutters?.unsubscribe();
    this.#subToSelection?.unsubscribe();
  }

  sum(array: number[]): number {
    return array.reduce((acc, val) => acc + val);
  }
}
