import { DestroyService } from '../services/destroy';
import { OLMapComponent } from './ol-map';

import { ChangeDetectionStrategy } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';
import { OnInit } from '@angular/core';

import { inject } from '@angular/core';
import { takeUntil } from 'rxjs/operators';

@Component({
  changeDetection: ChangeDetectionStrategy.Default,
  providers: [DestroyService],
  selector: 'app-ol-control-zoom',
  template: `
    <p class="annotation">{{ resolution | number: '1.0-2' }}</p>

    <div class="slider-wrapper">
      <input
        (change)="onZoomChange($any($event.srcElement).value)"
        [max]="maxZoom()"
        [min]="minZoom()"
        [step]="1"
        [value]="zoom"
        class="slider"
        orient="horizontal"
        type="range" />
    </div>

    <p class="annotation">{{ zoom | number: '1.0-2' }}</p>
  `,
  styles: [
    `
      :host {
        display: grid;
        grid-template-rows: auto 1fr auto;
        justify-content: center;
        padding: 0.25rem;
        pointer-events: auto;
        width: 3rem;
      }

      input[type='range'] {
        accent-color: var(--mat-gray-800);
      }

      .annotation {
        color: var(--mat-gray-700);
        font-size: 0.75rem;
        text-align: center;
      }

      .slider {
        height: 3rem;
        margin: 0;
        transform: rotate(-90deg);
        transform-origin: 5rem 5rem;
        width: 10rem;
      }

      .slider-wrapper {
        height: 10rem;
        padding: 0;
        width: 3rem;
      }
    `
  ]
})
export class OLControlZoomComponent implements OnInit {
  @Input() resolution: number;
  @Input() zoom: number;
  @Input() zoomAnimationDuration = 250;

  #cdf = inject(ChangeDetectorRef);
  #destroy$ = inject(DestroyService);
  #map = inject(OLMapComponent);

  maxZoom(): number {
    return this.#map.maxZoom;
  }

  minZoom(): number {
    return this.#map.minZoom;
  }

  ngOnInit(): void {
    this.#handleZoom$();
  }

  onZoomChange(zoom: number): void {
    this.zoom = zoom;
    // 🪲 null is not an object (evaluating 'this.map.olView.animate')
    this.#map.olView?.animate({
      duration: this.zoomAnimationDuration,
      zoom
    });
  }

  #handleZoom$(): void {
    this.#map.zoomChange.pipe(takeUntil(this.#destroy$)).subscribe((zoom) => {
      this.zoom = zoom;
      this.resolution = this.#map.olView.getResolutionForZoom(zoom);
      // 👉 because event is triggered out of the Angular zone
      this.#cdf.markForCheck();
    });
  }
}
