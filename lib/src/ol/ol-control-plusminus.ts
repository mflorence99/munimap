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
  selector: 'app-ol-control-plusminus',
  templateUrl: './ol-control-plusminus.html',
  styleUrls: ['./ol-control-plusminus.scss']
})
export class OLControlPlusMinusComponent implements OnInit {
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
      // 👉 because event is triggered out of the Angular zone
      this.cdf.markForCheck();
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
    // 🐛 null is not an object (evaluating 'this.map.olView.animate')
    this.map.olView?.animate({
      duration: this.zoomAnimationDuration,
      zoom
    });
  }
}
