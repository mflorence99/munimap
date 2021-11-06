import { AuthState } from '../../state/auth';
import { ConfirmDialogComponent } from '../../components/confirm-dialog';
import { ConfirmDialogData } from '../../components/confirm-dialog';
import { DeleteMap } from '../../state/map';
import { Descriptor } from '../../services/typeregistry';
import { Map } from '../../state/map';
import { RootPage } from '../../pages/root/root';
import { TownMapPage } from './town-map';
import { TypeRegistry } from '../../services/typeregistry';
import { UpdateMap } from '../../state/map';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Store } from '@ngxs/store';

import copy from 'fast-copy';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-town-map-setup',
  styleUrls: ['./town-map-setup.scss'],
  templateUrl: './town-map-setup.html'
})
export class TownMapSetupComponent {
  #map: Map;

  @Input()
  get map(): Map {
    return this.#map;
  }
  set map(map: Map) {
    this.#map = copy(map);
    // 👉 set the window title every time it changes
    if (map.name) this.root.setTitle(map.name);
  }

  rolledup: boolean;

  constructor(
    private authState: AuthState,
    private dialog: MatDialog,
    public registry: TypeRegistry,
    private root: RootPage,
    private router: Router,
    private store: Store,
    public townMap: TownMapPage
  ) {
    this.rolledup = !this.townMap.creating;
  }

  canDelete(): boolean {
    return (
      !this.townMap.creating &&
      this.map.owner === this.authState.currentProfile().email
    );
  }

  delete(map: any): void {
    const data: ConfirmDialogData = {
      content:
        'The map will be permanently deleted, but any changes made to parcels will be kept for use in other maps.',
      title: 'Please confirm map deletion'
    };
    this.dialog
      .open(ConfirmDialogComponent, { data, width: '25rem' })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          this.store.dispatch(new DeleteMap(map.id));
          this.router.navigate(['/map-create']);
        }
      });
  }

  trackByStyle(ix: number, item: [any, Descriptor]): string {
    return item[0];
  }

  update(map: any): void {
    this.store.dispatch(new UpdateMap(map));
  }
}
