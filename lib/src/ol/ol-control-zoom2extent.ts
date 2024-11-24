import { OLMapComponent } from "./ol-map";

import { ChangeDetectionStrategy } from "@angular/core";
import { Component } from "@angular/core";

import { inject } from "@angular/core";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-ol-control-zoom2extent",
  template: `
    <button (click)="zoom2extent()" mat-icon-button>
      <fa-icon [icon]="['fas', 'expand-arrows']" size="2x"></fa-icon>
    </button>
  `,
  styles: [
    `
      :host {
        display: block;
        pointer-events: auto;
      }
    `
  ],
  standalone: false
})
export class OLControlZoomToExtentComponent {
  #map = inject(OLMapComponent);

  zoom2extent(): void {
    this.#map.zoomToBounds();
  }
}
