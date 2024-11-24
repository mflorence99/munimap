import { OLMapComponent } from "./ol-map";

import { environment } from "../environment";

import { ChangeDetectionStrategy } from "@angular/core";
import { Component } from "@angular/core";

import { inject } from "@angular/core";

import OLLayer from "ol/layer/Layer";

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: "app-ol-control-attribution",
    template: `
    <article class="control">
      <ul #attribution class="attribution" [class.collapsed]="collapsed">
        <header class="header">For Information Only</header>
        <li class="item">Version {{ env.package.version }}</li>
        <li class="item">
          Build {{ env.build.id }} {{ env.build.date | date }}
        </li>

        <header class="header">Credits</header>

        @for (attribution of attributions; track attribution) {
          <li [innerHTML]="attribution" class="item"></li>
        }
      </ul>

      <button (click)="toggleAttributions()" mat-icon-button>
        <fa-icon [icon]="['fas', 'info-circle']" size="2x"></fa-icon>
      </button>
    </article>
  `,
    styles: [
        `
      :host {
        display: block;
        pointer-events: auto;
      }

      .attribution {
        background-color: rgba(var(--rgb-gray-100), 0.75);
        bottom: -0.25rem;
        opacity: 1;
        padding: 0.5rem;
        position: absolute;
        right: 4rem;
        transition: opacity 0.25s ease-in-out;
        width: auto;

        .item {
          white-space: nowrap;
        }
      }

      .attribution.collapsed {
        opacity: 0;
        pointer-events: none;
      }

      .control {
        align-items: center;
        display: flex;
        position: relative;
      }

      .header {
        font-weight: bold;
      }
    `
    ],
    standalone: false
})
export class OLControlAttributionComponent {
  attributions: string[] = [];
  collapsed = true;

  env = environment;

  #map = inject(OLMapComponent);

  toggleAttributions(): void {
    this.collapsed = !this.collapsed;
    if (!this.collapsed) {
      this.attributions = [];
      this.#map.olMap.getLayers().forEach((layer: any) => {
        (layer as OLLayer<any, any>)
          ?.getSource()
          ?.getAttributions?.()?.()
          ?.forEach((attribution) => {
            if (!this.attributions.includes(attribution))
              this.attributions.push(attribution);
          });
      });
    }
  }
}
