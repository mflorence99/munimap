import { DestroyService } from '../services/destroy';
import { OLMapComponent } from './ol-map';
import { ViewActions } from '../state/view';
import { ViewState } from '../state/view';

import { ChangeDetectionStrategy } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { OnInit } from '@angular/core';
import { Store } from '@ngxs/store';

import { inject } from '@angular/core';
import { takeUntil } from 'rxjs/operators';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-control-accessibility',
  template: `
    <article class="control">
      <button
        (click)="toggleAccessibility()"
        mat-icon-button
        title="Show/hide accessibility">
        <fa-icon
          [icon]="['fas', 'universal-access']"
          class="universal-access"
          size="2x"></fa-icon>
      </button>

      <table class="accessibility" [class.collapsed]="collapsed">
        @for (filter of filters; track filter.tag) {
          <tr>
            <td>
              @if (filter.filter === accessibilityFilter) {
                &check;
              }
            </td>
            <td class="filter">
              <a (click)="onFilter(filter.filter)" href="javascript: void(0)">
                {{ filter.tag }}
              </a>
            </td>
          </tr>
        }
      </table>
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
        border: 0.5rem solid transparent;
        border-collapse: collapse;
        bottom: -0.25rem;
        opacity: 1;
        position: absolute;
        right: 4rem;
        transition:
          display 0.25s ease allow-discrete,
          opacity 0.25s ease;

        td {
          padding-right: 0.25rem;
          white-space: nowrap;
        }

        td.filter {
          width: 100%;
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
        color: var(--primary-color);
      }
    `
  ],
  standalone: false
})
export class OLControlAccessibilityComponent implements OnInit {
  accessibilityFilter: string;
  accessibilityFilter$: Observable<string>;
  collapsed = true;
  filters = [
    { filter: 'none', tag: 'Normal' },
    { filter: 'grayscale()', tag: 'Grayscale' },
    { filter: 'invert(100%)', tag: 'Inverted' },
    { filter: 'contrast(175%)', tag: 'High contrast' },
    { filter: 'saturate(500%)', tag: 'Color blindness' }
  ];

  #cdf = inject(ChangeDetectorRef);
  #destroy$ = inject(DestroyService);
  #map = inject(OLMapComponent);
  #store = inject(Store);

  constructor() {
    this.accessibilityFilter$ = this.#store.select(
      ViewState.accessibilityFilter
    );
  }

  ngOnInit(): void {
    this.#handleEscape$();
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
        const viewport: any = document.querySelector('.ol-viewport');
        viewport.style.filter = accessibilityFilter || 'none';
      });
  }

  #handleEscape$(): void {
    this.#map.escape$.pipe(takeUntil(this.#destroy$)).subscribe(() => {
      this.collapsed = true;
      this.#cdf.markForCheck();
    });
  }
}
