import { ChangeDetectionStrategy } from "@angular/core";
import { ChangeDetectorRef } from "@angular/core";
import { Component } from "@angular/core";
import { OnInit } from "@angular/core";
import { MatMenu } from "@angular/material/menu";
import { MatMenuTrigger } from "@angular/material/menu";
import { OLMapComponent } from "@lib/ol/ol-map";
import { DestroyService } from "@lib/services/destroy";

import { contentChild } from "@angular/core";
import { inject } from "@angular/core";
import { viewChild } from "@angular/core";
import { filter } from "rxjs/operators";
import { takeUntil } from "rxjs/operators";

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [DestroyService],
    selector: "app-contextmenu",
    template: `
    @if (contextMenu) {
      <div
        #trigger
        class="trigger"
        [matMenuTriggerData]="{ selected: map.selected }"
        [matMenuTriggerFor]="contextMenu()"
        [style.left.px]="menuPosition.x"
        [style.top.px]="menuPosition.y"></div>
    }

    <ng-content select="[mapContextMenu]"></ng-content>
  `,
    styles: [
        `
      .trigger {
        position: absolute;
        visibility: fixed;
      }
    `
    ],
    standalone: false
})
export class ContextMenuComponent implements OnInit {
  contextMenu = contentChild(MatMenu);
  contextMenuTrigger = viewChild(MatMenuTrigger);

  map = inject(OLMapComponent);

  menuPosition = {
    x: 0,
    y: 0
  };

  #cdf = inject(ChangeDetectorRef);
  #destroy$ = inject(DestroyService);

  closeMenu(): void {
    this.contextMenuTrigger().closeMenu();
  }

  ngOnInit(): void {
    this.#handleContextMenu$();
  }

  openMenu(): void {
    this.contextMenuTrigger().openMenu();
  }

  #handleContextMenu$(): void {
    this.map.contextMenu$
      .pipe(
        takeUntil(this.#destroy$),
        filter((event) => !!event)
      )
      .subscribe((event: PointerEvent) => {
        if (this.contextMenu()) {
          // 👉 need to hack the Y offset by the height of the toolbar
          const style = getComputedStyle(document.documentElement);
          const hack = style.getPropertyValue("--map-cy-toolbar");
          const pixel = [event.clientX, event.clientY - Number(hack)];
          // 👉 position the menu
          this.menuPosition.x = pixel[0] + 8;
          this.menuPosition.y = pixel[1] + 8;
          // 👉 because event is triggered out of the Angular zone
          this.#cdf.markForCheck();
          this.contextMenuTrigger().openMenu();
        }
      });
  }
}
