import { ChangeDetectionStrategy } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { Component } from '@angular/core';
import { ContentChild } from '@angular/core';
import { DestroyService } from '@lib/services/destroy';
import { MatMenu } from '@angular/material/menu';
import { MatMenuTrigger } from '@angular/material/menu';
import { OLMapComponent } from '@lib/ol/ol-map';
import { OnInit } from '@angular/core';
import { ViewChild } from '@angular/core';

import { takeUntil } from 'rxjs/operators';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DestroyService],
  selector: 'app-contextmenu',
  templateUrl: './contextmenu.html',
  styleUrls: ['./contextmenu.scss']
})
export class ContextMenuComponent implements OnInit {
  @ContentChild(MatMenu) contextMenu: MatMenu;
  @ViewChild(MatMenuTrigger) contextMenuTrigger: MatMenuTrigger;

  menuPosition = {
    x: 0,
    y: 0
  };

  constructor(
    private cdf: ChangeDetectorRef,
    private destroy$: DestroyService,
    public map: OLMapComponent
  ) {}

  #handleContextMenu$(): void {
    this.map.contextMenu$
      .pipe(takeUntil(this.destroy$))
      .subscribe((event: PointerEvent) => {
        if (this.contextMenu) {
          // 👉 need to hack the Y offset by the height of the toolbar
          const style = getComputedStyle(document.documentElement);
          const hack = style.getPropertyValue('--map-cy-toolbar');
          const pixel = [event.clientX, event.clientY - Number(hack)];
          // 👉 position the menu
          this.menuPosition.x = pixel[0] + 8;
          this.menuPosition.y = pixel[1] + 8;
          // 👉 because event is triggered out of the Angular zone
          this.cdf.markForCheck();
          this.contextMenuTrigger.openMenu();
        }
      });
  }

  closeMenu(): void {
    this.contextMenuTrigger.closeMenu();
  }

  ngOnInit(): void {
    this.#handleContextMenu$();
  }

  openMenu(): void {
    this.contextMenuTrigger.openMenu();
  }
}
