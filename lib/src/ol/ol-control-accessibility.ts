import { ChangeDetectionStrategy } from "@angular/core";
import { Component } from "@angular/core";
import { Store } from "@ngxs/store";
import { Observable } from "rxjs";
import { DestroyService } from "../services/destroy";
import { ViewActions } from "../state/view";
import { ViewState } from "../state/view";

import { inject } from "@angular/core";
import { takeUntil } from "rxjs/operators";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-ol-control-accessibility",
  template: `
    <article class="control">

      <button 
        (click)="toggleAccessibility()" 
        mat-icon-button 
        title="Show/hide accessibility">
        <fa-icon [icon]="['fas', 'universal-access']" class="universal-access" size="2x"></fa-icon>
      </button>
 
       <nav class="accessibility" [class.collapsed]="collapsed">
        @for (filter of filters; track filter.tag) {
          <div class="item" >
            @if (filter.filter === accessibilityFilter) {
              &check;
            } @else {
              &nbsp;
            }
            <a 
              (click)="onFilter(filter.filter)" 
              href="javascript: void(0)">
              {{ filter.tag }}
            </a>
        </div>
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

      .accessibility {
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

      .accessibility.collapsed {
        display: none;
        opacity: 0;
      }

      .control {
        align-items: center;
        display: flex;
        position: relative;
      }

      .universal-access {
        color: rgba(33, 150, 243, 100%);
      }
    `
  ],
  standalone: false
})
export class OLControlAccessibilityComponent {
  accessibilityFilter: string;
  accessibilityFilter$: Observable<string>;
  collapsed = true;
  filters = [
    { filter: "none", tag: "Normal mode" },
    { filter: "grayscale()", tag: "Grayscale" },
    { filter: "contrast(200%)", tag: "High contrast" },
    { filter: "saturate(500%)", tag: "Color blindness" }
  ];

  #destroy$ = inject(DestroyService);
  #store = inject(Store);

  constructor() {
    this.accessibilityFilter$ = this.#store.select(
      ViewState.accessibilityFilter
    );
  }

  ngOnInit(): void {
    this.#handleAccessibility$();
  }

  onFilter(filter: string): void {
    this.#store.dispatch(new ViewActions.SetAccessibilityFilter(filter));
  }

  toggleAccessibility(): void {
    this.collapsed = !this.collapsed;
  }

  #handleAccessibility$(): void {
    this.accessibilityFilter$
      .pipe(takeUntil(this.#destroy$))
      .subscribe((accessibilityFilter) => {
        this.accessibilityFilter = accessibilityFilter;
        const viewport: any = document.querySelector(".ol-viewport");
        viewport.style.filter = accessibilityFilter || "none";
      });
  }
}
