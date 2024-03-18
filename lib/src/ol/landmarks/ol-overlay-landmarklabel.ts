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

import { fromLonLat } from 'ol/proj';
import { inject } from '@angular/core';
import { takeUntil } from 'rxjs/operators';
import { toLonLat } from 'ol/proj';
import { viewChild } from '@angular/core';

import OLFeature from 'ol/Feature';
import OLOverlay from 'ol/Overlay';
import OLPoint from 'ol/geom/Point';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DestroyService],
  selector: 'app-ol-overlay-landmarklabel',
  template: `
    <div #label (cdkDragEnded)="onDragEnd($event)" cdkDrag>
      <fa-icon [icon]="['fas', 'crosshairs']" class="icon" size="2x"></fa-icon>
    </div>
  `,
  styles: [
    `
      :host {
        cursor: pointer;
        display: block;
        position: absolute;
      }

      .icon {
        color: var(--background-color);
      }
    `
  ]
})
export class OLOverlayLandmarkLabelComponent implements OnInit {
  label = viewChild<ElementRef>('label');
  olOverlay: OLOverlay;

  #destroy$ = inject(DestroyService);
  #feature: OLFeature<any>;
  #map = inject(OLMapComponent);
  #store = inject(Store);

  constructor() {
    this.olOverlay = new OLOverlay({
      position: [0, 0],
      positioning: 'center-center'
    });
    this.olOverlay.setProperties({ component: this }, true);
    this.#map.olMap.addOverlay(this.olOverlay);
  }

  ngOnInit(): void {
    this.olOverlay.setElement(this.label().nativeElement);
    this.#handleClick$();
  }

  onDragEnd(event: CdkDragEnd): void {
    // 👉 what is the new position?
    const position = toLonLat(
      this.#map.coordinateFromEvent(event.dropPoint.x, event.dropPoint.y)
    );
    // 👉 update point labels
    if (this.#feature.getGeometry().getType() === 'Point') {
      this.#feature.setGeometry(new OLPoint(fromLonLat(position)));
      const movedLandmark: Partial<Landmark> = {
        id: this.#feature.getId() as string,
        geometry: { type: 'Point', coordinates: position },
        type: 'Feature'
      };
      this.#store.dispatch(new UpdateLandmark(movedLandmark));
    }
    // 👉 update point labels
    else if (this.#feature.getGeometry().getType() === 'Polygon') {
      this.#feature.set('textLocation', position);
      const movedLandmark: Partial<Landmark> = {
        id: this.#feature.getId() as string,
        properties: { textLocation: position as [number, number] },
        type: 'Feature'
      };
      this.#store.dispatch(new UpdateLandmark(movedLandmark));
    }
    this.olOverlay.setPosition([0, 0]);
    // 👉 https://stackoverflow.com/questions/61157528
    event.source._dragRef.reset();
  }

  // 👉 setFeature is called by the contextmenu code to initiate
  //    this interaction

  setFeature(feature: OLFeature<any>): void {
    this.#feature = feature;
    if (feature.getGeometry().getType() === 'Point')
      this.olOverlay.setPosition(feature.getGeometry().getCoordinates());
    else if (feature.getGeometry().getType() === 'Polygon') {
      if (feature.get('textLocation'))
        this.olOverlay.setPosition(fromLonLat(feature.get('textLocation')));
      else {
        const center = feature
          .getGeometry()
          .getInteriorPoint()
          .getCoordinates();
        this.olOverlay.setPosition(center);
      }
    }
  }

  #handleClick$(): void {
    this.#map.click$
      .pipe(takeUntil(this.#destroy$))
      .subscribe(() => this.olOverlay.setPosition([0, 0]));
  }
}
