import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-control-parcel-list',
  template: `
    <article class="control">
      <ul #list class="list" [class.collapsed]="collapsed">
        XXX
      </ul>

      <button (click)="toggleList()" mat-icon-button>
        <fa-icon [icon]="['fal', 'list-ol']" size="2x"></fa-icon>
      </button>
    </article>
  `,
  styles: [
    `
      :host {
        display: block;
        pointer-events: auto;
      }

      .control {
        align-items: center;
        display: flex;
        position: relative;
      }

      .list {
        align-items: center;
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

      .list.collapsed {
        opacity: 0;
        pointer-events: none;
      }

      .header {
        font-weight: bold;
      }
    `
  ]
})
export class OLControlParcelListComponent {
  collapsed = true;

  toggleList(): void {
    this.collapsed = !this.collapsed;
    if (!this.collapsed) {
    }
  }
}
