import { OLMapComponent } from './ol-map';
import { ParcelProperties } from '../geojson';
import { TypeRegistry } from '../services/typeregistry';

import { ChangeDetectionStrategy } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';

// 👇 we can't use the normal DestroyService protocol here
//    as snackbar popups don't have a standard lifecycle
//    when created via openFromTemplate

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-popup-parcelproperties',
  templateUrl: './ol-popup-parcelproperties.html',
  styleUrls: ['./ol-popup-parcelproperties.scss']
})
export class OLPopupParcelPropertiesComponent {
  #subscription: Subscription;

  @Input() maxNumProperties = 3;

  properties: ParcelProperties[] = [];

  sameAddress: boolean;
  sameOwner: boolean;
  sameUsage: boolean;

  constructor(
    private cdf: ChangeDetectorRef,
    private map: OLMapComponent,
    public registry: TypeRegistry,
    private snackBar: MatSnackBar
  ) {
    this.map.selector.featuresSelected.subscribe((features) => {
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
        this.cdf.markForCheck();
      }
    });
  }

  onClose(): void {
    this.#subscription?.unsubscribe();
    this.snackBar.dismiss();
  }

  sum(array: number[]): number {
    return array.reduce((acc, val) => acc + val);
  }
}
