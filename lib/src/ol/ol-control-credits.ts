import { OLMapComponent } from "./ol-map";
import { Mapable } from "./ol-mapable";
import { MapableComponent } from "./ol-mapable";

import { ChangeDetectionStrategy } from "@angular/core";
import { ChangeDetectorRef } from "@angular/core";
import { Component } from "@angular/core";
import { ElementRef } from "@angular/core";
import { OnInit } from "@angular/core";
import { Control as OLControl } from "ol/control";

import { forwardRef } from "@angular/core";
import { inject } from "@angular/core";
import { input } from "@angular/core";
import { viewChild } from "@angular/core";

// 🔥 this control is designed ONLY to be printed on the map

class Credits extends OLControl {
  constructor(opts: any) {
    super(opts);
  }
}

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        {
            provide: MapableComponent,
            useExisting: forwardRef(() => OLControlCreditsComponent)
        }
    ],
    selector: "app-ol-control-credits",
    template: `
    <article
      #creditsRef
      [ngStyle]="{ 'bottom.px': bottom, 'right.px': right }"
      class="credits ol-unselectable">
      <footer
        [ngClass]="{ contrast: showCreditsContrast() }"
        [ngStyle]="{ 'fontSize.px': fontSize, 'height.px': height }"
        class="footer">
        {{ now | date: 'longDate' }}&nbsp;|&nbsp;Credits:&nbsp;
        <ul>
          @for (attribution of attributions; track attribution) {
            <li [innerHTML]="attribution"></li>
          }
        </ul>
      </footer>
    </article>
  `,
    styles: [
        `
      .credits {
        position: absolute;

        .footer {
          color: var(--background-color);
          font-family: 'Bentham Regular', sans-serif;
          padding: 0 0.5rem;
          white-space: nowrap;

          &.contrast {
            color: var(--text-color);
            -webkit-text-stroke-color: var(--background-color);

            ::ng-deep a {
              color: var(--text-color);
            }
          }

          ::ng-deep a {
            color: var(--background-color);
          }

          li,
          ul {
            display: inline-block;
          }

          li:not(:last-of-type)::after {
            content: ' | ';
          }
        }
      }
    `
    ],
    standalone: false
})
export class OLControlCreditsComponent implements Mapable, OnInit {
  attributions: string[] = [];
  creditsRef = viewChild<ElementRef>("creditsRef");
  now = Date.now();
  olControl: OLControl;
  scaleFactor = input(125);
  showCreditsContrast = input<boolean>();

  #cdf = inject(ChangeDetectorRef);
  #map = inject(OLMapComponent);

  // 👇 set the position proportional to the map size
  get bottom(): number {
    const element = this.#map.olMap.getTargetElement();
    return element.clientHeight / this.scaleFactor();
  }

  // 👇 set the font size proportional to the map size
  get fontSize(): number {
    const element = this.#map.olMap.getTargetElement();
    return element.clientHeight / this.scaleFactor();
  }

  // 👇 set the height proportional to the map size
  get height(): number {
    return this.fontSize * 1.25;
  }

  // 👇 set the position proportional to the map size
  get right(): number {
    return this.bottom;
  }

  addToMap(): void {
    this.#map.olMap.addControl(this.olControl);
  }

  mapUpdated(): void {
    const raw = this.#map.olMap
      .getLayers()
      .getArray()
      .map(
        (layer: any): string[] => layer.getSource().getAttributions()?.() ?? []
      )
      .flat();
    this.attributions = Array.from(new Set(raw));
    this.#cdf.markForCheck();
  }

  ngOnInit(): void {
    this.olControl = new Credits({ element: this.creditsRef().nativeElement });
    this.olControl.setProperties({ component: this }, true);
  }
}
