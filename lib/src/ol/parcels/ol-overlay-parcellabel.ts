import { AddParcels } from '../../state/parcels';
import { AuthState } from '../../state/auth';
import { DestroyService } from '../../services/destroy';
import { OLMapComponent } from '../ol-map';
import { Parcel } from '../../common';
import { ParcelID } from '../../common';

import { CdkDragEnd } from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { ElementRef } from '@angular/core';
import { OnInit } from '@angular/core';
import { Store } from '@ngxs/store';
import { ViewChild } from '@angular/core';

import { fromLonLat } from 'ol/proj';
import { merge } from 'rxjs';
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
  selector: 'app-ol-overlay-parcellabel',
  templateUrl: './ol-overlay-parcellabel.html',
  styleUrls: ['./ol-overlay-parcellabel.scss']
})
export class OLOverlayParcelLabelComponent implements OnInit {
  #centers: number[][];
  #id: ParcelID;
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
    this.olOverlay.setProperties({ component: this }, true);
    this.map.olMap.addOverlay(this.olOverlay);
  }

  // 👇 the idea is that a selection change or ESC cancels the move

  #handleStreams$(): void {
    merge(this.map.click$, this.map.escape$, this.map.featuresSelected)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.olOverlay.setPosition([0, 0]));
  }

  ngOnInit(): void {
    this.olOverlay.setElement(this.label.nativeElement);
    this.#handleStreams$();
  }

  onDragEnd(event: CdkDragEnd): void {
    // 👉 construct a parcel to override the label position
    const centers = this.#centers;
    centers[this.#ix] = toLonLat(
      this.map.coordinateFromEvent(event.dropPoint.x, event.dropPoint.y)
    );
    const recenteredParcel: Parcel = {
      action: 'modified',
      id: this.#id,
      owner: this.authState.currentProfile().email,
      path: this.map.path,
      properties: {
        centers: centers
      },
      type: 'Feature'
    };
    this.store.dispatch(new AddParcels([recenteredParcel]));
    this.olOverlay.setPosition([0, 0]);
    // 👉 https://stackoverflow.com/questions/61157528
    event.source._dragRef.reset();
  }

  // 👉 setFeature is called by the contextmenu code to initiate
  //    this interaction

  setFeature(feature: OLFeature<any>): void {
    this.#centers = feature.getProperties().centers;
    this.#id = feature.getId();
    this.#ix = 0;
    if (feature.getGeometry().getType() === 'MultiPolygon') {
      const polygons = feature.getGeometry().getPolygons();
      for (this.#ix = 0; this.#ix < polygons.length; this.#ix++) {
        // 👉 we need to know which of the possible multiple ploygons
        //    that make up the parcel we will be re-centering
        const pt = point(this.map.contextMenuAt);
        const poly = polygon([polygons[this.#ix].getCoordinates()[0]]);
        if (booleanPointInPolygon(pt, poly)) break;
      }
    }
    this.olOverlay.setPosition(fromLonLat(this.#centers[this.#ix]));
  }
}
