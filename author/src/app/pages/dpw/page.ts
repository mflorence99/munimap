import { AbstractMapPage } from '../abstract-map';
import { RootPage } from '../root/page';

import { Actions } from '@ngxs/store';
import { ActivatedRoute } from '@angular/router';
import { AuthState } from '@lib/state/auth';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { ComponentFactory } from '@angular/core';
import { ContextMenuComponent } from 'app/components/contextmenu';
import { DestroyService } from '@lib/services/destroy';
import { MapType } from '@lib/state/map';
import { Router } from '@angular/router';
import { SidebarComponent } from 'app/components/sidebar-component';
import { Store } from '@ngxs/store';
import { ViewChild } from '@angular/core';
import { ViewState } from '@lib/state/view';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DestroyService],
  selector: 'app-dpw',
  styleUrls: ['../abstract-map.scss'],
  templateUrl: './page.html'
})
export class DPWPage extends AbstractMapPage {
  @ViewChild(ContextMenuComponent) contextMenu: ContextMenuComponent;

  constructor(
    protected actions$: Actions,
    protected authState: AuthState,
    protected destroy$: DestroyService,
    protected root: RootPage,
    protected route: ActivatedRoute,
    protected router: Router,
    protected store: Store,
    protected viewState: ViewState
  ) {
    super(actions$, authState, destroy$, root, route, router, store, viewState);
  }

  #can(event: MouseEvent, condition: boolean): boolean {
    if (!condition && event) event.stopPropagation();
    return condition;
  }

  canDeleteLandmark(event?: MouseEvent): boolean {
    return this.#can(
      event,
      !this.olMap.roSelection && this.olMap.selected.length === 1
    );
  }

  getType(): MapType {
    return 'dpw';
  }

  onContextMenu(key: string): void {
    let cFactory: ComponentFactory<SidebarComponent>;
    switch (key) {
    }
    if (cFactory) this.onContextMenuImpl(cFactory);
    // 👇 in some cases, doesn't close itself
    this.contextMenu.closeMenu();
  }

  selectedLandmarkType(): string {
    return this.olMap.selected[0]?.get('type') || 'site';
  }
}
