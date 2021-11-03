import { DestroyService } from '../services/destroy';
import { OLMapComponent } from './ol-map';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { ElementRef } from '@angular/core';
import { OnInit } from '@angular/core';
import { ViewChild } from '@angular/core';

import { fromLonLat } from 'ol/proj';
import { takeUntil } from 'rxjs/operators';

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

  olOverlay: OLOverlay;

  constructor(
    private destroy$: DestroyService,
    private host: ElementRef,
    private map: OLMapComponent
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
    console.log(event);
  }

  onDragStart(event: DragEvent): void {
    console.log(event);
  }

  setFeature(feature: OLFeature<any>): void {
    this.olOverlay.setPosition(fromLonLat(feature.getProperties().center));
  }
}
