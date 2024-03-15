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
  selector: 'app-ol-control-plusminus',
  template: `
    <button
      (click)="onZoomChange(zoom + 1)"
      [disabled]="zoom >= maxZoom()"
      mat-icon-button>
      <fa-icon [icon]="['fal', 'plus']" size="2x"></fa-icon>
    </button>

    <button
      (click)="onZoomChange(zoom - 1)"
      [disabled]="zoom <= minZoom()"
      mat-icon-button>
      <fa-icon [icon]="['fal', 'minus']" size="2x"></fa-icon>
    </button>

    <p class="annotation">{{ zoom | number: '1.0-2' }}</p>
  `,
  styles: [
    `
      :host {
        display: grid;
        grid-template-rows: auto auto auto;
        justify-content: center;
        padding: 0.25rem;
        pointer-events: auto;
        width: 3rem;
      }

      .annotation {
        color: var(--mat-gray-700);
        font-size: 0.75rem;
        text-align: center;
      }
    `
  ]
})
export class OLControlPlusMinusComponent implements OnInit {
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
    // 🐛 null is not an object (evaluating 'this.map.olView.animate')
    this.#map.olView?.animate({
      duration: this.zoomAnimationDuration,
      zoom
    });
  }

  #handleZoom$(): void {
    this.#map.zoomChange.pipe(takeUntil(this.#destroy$)).subscribe((zoom) => {
      this.zoom = zoom;
      // 👉 because event is triggered out of the Angular zone
      this.#cdf.markForCheck();
    });
  }
}
