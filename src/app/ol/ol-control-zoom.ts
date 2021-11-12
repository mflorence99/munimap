import { DestroyService } from '../services/destroy';
import { OLMapComponent } from './ol-map';

import { ChangeDetectionStrategy } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';
import { OnInit } from '@angular/core';

import { takeUntil } from 'rxjs/operators';

@Component({
  changeDetection: ChangeDetectionStrategy.Default,
  providers: [DestroyService],
  selector: 'app-ol-control-zoom',
  templateUrl: './ol-control-zoom.html',
  styleUrls: ['./ol-control-zoom.scss']
})
export class OLControlZoomComponent implements OnInit {
  @Input() resolution: number;
  @Input() zoom: number;
  @Input() zoomAnimationDuration = 250;

  constructor(
    private cdf: ChangeDetectorRef,
    private destroy$: DestroyService,
    private map: OLMapComponent
  ) {}

  #handleZoom$(): void {
    this.map.zoomChange.pipe(takeUntil(this.destroy$)).subscribe((zoom) => {
      this.zoom = zoom;
      this.resolution = this.map.olView.getResolutionForZoom(zoom);
      // 👉 because event is triggered out of the Angular zone
      this.cdf.detectChanges();
    });
  }

  maxZoom(): number {
    return this.map.maxZoom;
  }

  minZoom(): number {
    return this.map.minZoom;
  }

  ngOnInit(): void {
    this.#handleZoom$();
  }

  onZoomChange(zoom: number): void {
    this.zoom = zoom;
    this.map.olView.animate({
      duration: this.zoomAnimationDuration,
      zoom
    });
  }
}
