import { OLMapComponent } from "./ol-map";

import { ChangeDetectionStrategy } from "@angular/core";
import { ChangeDetectorRef } from "@angular/core";
import { Component } from "@angular/core";
import { OnInit } from "@angular/core";

import { inject } from "@angular/core";
import { input } from "@angular/core";
import { model } from "@angular/core";

@Component({
  changeDetection: ChangeDetectionStrategy.Default,
  selector: "app-ol-control-plusminus",

  template: `
    <button
      (click)="onZoomChange(zoom() + 1)"
      [disabled]="zoom() >= maxZoom()"
      mat-icon-button>
      <fa-icon [icon]="['fal', 'plus']" size="2x"></fa-icon>
    </button>

    <button
      (click)="onZoomChange(zoom() - 1)"
      [disabled]="zoom() <= minZoom()"
      mat-icon-button>
      <fa-icon [icon]="['fal', 'minus']" size="2x"></fa-icon>
    </button>

    <p class="annotation">{{ zoom() | number: '1.0-2' }}</p>
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
  zoom = model<number>();
  zoomAnimationDuration = input(250);

  #cdf = inject(ChangeDetectorRef);
  #map = inject(OLMapComponent);

  maxZoom(): number {
    return this.#map.maxZoom();
  }

  minZoom(): number {
    return this.#map.minZoom();
  }

  ngOnInit(): void {
    this.#handleZoom$();
  }

  onZoomChange(zoom: number): void {
    this.zoom.set(zoom);
    // 🐛 null is not an object (evaluating 'this.map.olView.animate')
    this.#map.olView?.animate({
      duration: this.zoomAnimationDuration(),
      zoom
    });
  }

  #handleZoom$(): void {
    this.#map.zoomChange.subscribe((zoom) => {
      this.zoom.set(zoom);
      // 👉 because event is triggered out of the Angular zone
      this.#cdf.markForCheck();
    });
  }
}
