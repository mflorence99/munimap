import { Feature } from '../geojson';
import { OLMapComponent } from './ol-map';
import { ParcelID } from '../geojson';
import { ParcelProperties } from '../geojson';
import { TypeRegistry } from '../services/typeregistry';

import { ChangeDetectionStrategy } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

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
  abutters: Abutter[] = [];

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
    this.#handleAbuttersFound$();
    this.#handleFeaturesSelected$();
  }

  #handleAbuttersFound$(): void {
    this.map.selector?.abuttersFound.subscribe((features: Feature[]) => {
      this.abutters = features
        .map((feature) => ({
          address: feature.properties.address,
          id: feature.id,
          owner: feature.properties.owner
        }))
        .sort((p, q) => String(p.id).localeCompare(String(q.id)));
      console.log(this.abutters);
      this.cdf.markForCheck();
    });
  }

  #handleFeaturesSelected$(): void {
    this.map.selector?.featuresSelected.subscribe(
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
          this.cdf.markForCheck();
        }
      }
    );
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

  onClose(): void {
    this.snackBar.dismiss();
  }

  sum(array: number[]): number {
    return array.reduce((acc, val) => acc + val);
  }
}
