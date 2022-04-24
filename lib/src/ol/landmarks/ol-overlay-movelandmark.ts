import { DestroyService } from '../../services/destroy';
import { Landmark } from '../../common';
import { OLMapComponent } from '../ol-map';
import { UpdateLandmark } from '../../state/landmarks';

import { CdkDragEnd } from '@angular/cdk/drag-drop';
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
import OLPoint from 'ol/geom/Point';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DestroyService],
  selector: 'app-ol-overlay-movelandmark',
  templateUrl: './ol-overlay-movelandmark.html',
  styleUrls: ['./ol-overlay-movelandmark.scss']
})
export class OLOverlayMoveLandmarkComponent implements OnInit {
  #feature: OLFeature<any>;
  #hack: number;

  olOverlay: OLOverlay;

  @ViewChild('point', { static: true }) point: ElementRef<HTMLDivElement>;

  constructor(
    private destroy$: DestroyService,
    private map: OLMapComponent,
    private store: Store
  ) {
    this.olOverlay = new OLOverlay({
      position: [0, 0],
      positioning: 'center-center'
    });
    this.map.olMap.addOverlay(this.olOverlay);
  }

  #handleClick$(): void {
    this.map.click$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.olOverlay.setPosition([0, 0]));
  }

  ngOnInit(): void {
    // 👉 need to hack Y offsets by the height of the toolbar
    const style = getComputedStyle(document.documentElement);
    this.#hack = Number(style.getPropertyValue('--map-cy-toolbar'));
    this.olOverlay.setElement(this.point.nativeElement);
    this.#handleClick$();
  }

  onDragEnd(event: CdkDragEnd): void {
    // 👉 what is the new position?
    const position = toLonLat(
      this.map.olMap.getCoordinateFromPixel([
        event.dropPoint.x,
        event.dropPoint.y - this.#hack
      ])
    );
    // 👉 update the Feature
    this.#feature.setGeometry(new OLPoint(fromLonLat(position)));
    // 👉 update the store
    const movedLandmark: Partial<Landmark> = {
      id: this.#feature.getId() as string,
      geometry: { type: 'Point', coordinates: position },
      type: 'Feature'
    };
    this.store.dispatch(new UpdateLandmark(movedLandmark));
    this.olOverlay.setPosition([0, 0]);
    // 👉 https://stackoverflow.com/questions/61157528
    event.source._dragRef.reset();
  }

  // 👉 setFeature is called by the contextmenu code to initiate
  //    this interaction

  setFeature(feature: OLFeature<any>): void {
    this.#feature = feature;
    this.olOverlay.setPosition(feature.getGeometry().getCoordinates());
  }
}
