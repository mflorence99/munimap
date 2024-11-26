import { DestroyService } from "../services/destroy";
import { OLMapComponent } from "./ol-map";

import { environment } from "../environment";

import { ChangeDetectionStrategy } from "@angular/core";
import { Component } from "@angular/core";
import { ChangeDetectorRef } from "@angular/core";
import { OnInit } from "@angular/core";

import { inject } from "@angular/core";
import { takeUntil } from "rxjs/operators";

import OLLayer from "ol/layer/Layer";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-ol-control-attribution",
  template: `
    <article class="control">

      <button 
        (click)="toggleAttributions()" 
        mat-icon-button 
        title="Show/hide attributions">
        <fa-icon [icon]="['fas', 'info-circle']" size="2x"></fa-icon>
      </button>
 
       <nav #attribution class="attribution" [class.collapsed]="collapsed">
        <header class="header">For Information Only</header>
        <div class="item">Version {{ env.package.version }}</div>
        <div class="item">
          Build {{ env.build.id }} {{ env.build.date | date }}
        </div>

        <header class="header">Credits</header>

        @for (attribution of attributions; track attribution) {
          <div [outerHTML]="attribution" class="item"></div>
        }
      </nav>

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
        display: flex;
        flex-direction: column;
        opacity: 1;
        padding: 0.5rem;
        position: absolute;
        right: 4rem;
        transition: display 0.25s ease allow-discrete, opacity 0.25s ease;
        width: auto;

        .item {
          white-space: nowrap;
        }
      }

      .attribution.collapsed {
        display: none;
        opacity: 0;
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
export class OLControlAttributionComponent implements OnInit {
  attributions: string[] = [];
  collapsed = true;
  env = environment;

  #cdf = inject(ChangeDetectorRef);
  #destroy$ = inject(DestroyService);
  #map = inject(OLMapComponent);

  ngOnInit(): void {
    this.#handleEscape$();
  }

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

  #handleEscape$(): void {
    this.#map.escape$.pipe(takeUntil(this.#destroy$)).subscribe(() => {
      this.collapsed = true;
      this.#cdf.markForCheck();
    });
  }
}
