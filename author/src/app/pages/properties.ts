import { RootPage } from './root/page';

import { AuthState } from '@lib/state/auth';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { ConfirmDialogComponent } from '@lib/components/confirm-dialog';
import { ConfirmDialogData } from '@lib/components/confirm-dialog';
import { DeleteMap } from '@lib/state/map';
import { Descriptor } from '@lib/services/typeregistry';
import { Input } from '@angular/core';
import { Map } from '@lib/state/map';
import { MatDialog } from '@angular/material/dialog';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { Store } from '@ngxs/store';
import { TypeRegistry } from '@lib/services/typeregistry';
import { UpdateMap } from '@lib/state/map';
import { ViewChild } from '@angular/core';

import copy from 'fast-copy';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-properties',
  styleUrls: ['./properties.scss'],
  templateUrl: './properties.html'
})
export class PropertiesComponent {
  #map: Map;

  @Input()
  get map(): Map {
    return this.#map;
  }
  set map(map: Map) {
    this.#map = copy(map);
    // 👉 set the window title every time it changes
    if (map.name) this.root.setTitle(map.name);
    this.rolledup = !!map.id;
  }

  rolledup: boolean;

  @ViewChild('setupForm', { static: true }) setupForm: NgForm;

  constructor(
    private authState: AuthState,
    private dialog: MatDialog,
    public registry: TypeRegistry,
    private root: RootPage,
    private router: Router,
    private store: Store
  ) {}

  canDelete(): boolean {
    return (
      this.map.id && this.map.owner === this.authState.currentProfile().email
    );
  }

  delete(map: any): void {
    const data: ConfirmDialogData = {
      content:
        'The map will be permanently deleted, but any changes made to parcels will be kept for use in other maps.',
      title: 'Please confirm map deletion'
    };
    this.dialog
      .open(ConfirmDialogComponent, { data })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          this.store.dispatch(new DeleteMap(map.id));
          this.router.navigate(['/create']);
        }
      });
  }

  trackByStyle(ix: number, item: [any, Descriptor]): string {
    return item[0];
  }

  update(map: any): void {
    this.store.dispatch(new UpdateMap(map));
    // 👉 this resets the dirty flag, disabling SAVE until
    //    additional data entered
    this.setupForm.form.markAsPristine();
  }
}
