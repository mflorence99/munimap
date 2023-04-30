import { RootPage } from '../pages//root/page';

import { AuthState } from '@lib/state/auth';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { ConfirmDialogComponent } from '@lib/components/confirm-dialog';
import { ConfirmDialogData } from '@lib/components/confirm-dialog';
import { DeleteMap } from '@lib/state/map';
import { Input } from '@angular/core';
import { Map } from '@lib/state/map';
import { MatDialog } from '@angular/material/dialog';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { Store } from '@ngxs/store';
import { UpdateMap } from '@lib/state/map';
import { ViewChild } from '@angular/core';

import copy from 'fast-copy';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-controlpanel-properties',
  styleUrls: ['./controlpanel.scss'],
  templateUrl: './controlpanel-properties.html'
})
export class ControlPanelPropertiesComponent {
  @ViewChild('setupForm') setupForm: NgForm;

  rolledup: boolean;

  #map: Map;

  constructor(
    private authState: AuthState,
    private dialog: MatDialog,
    private root: RootPage,
    private router: Router,
    private store: Store
  ) {}

  @Input() get map(): Map {
    return this.#map;
  }
  set map(map: Map) {
    this.#map = copy(map);
    // 👉 set the window title every time it changes
    if (map.name) this.root.setTitle(map.name);
    this.rolledup = !!map.id;
  }

  canDelete(): boolean {
    return (
      this.map.id && this.map.owner === this.authState.currentProfile().email
    );
  }

  cancel(): void {
    this.rolledup = true;
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

  update(map: any): void {
    // 👇 refresh if parcelIDs have changed
    this.store.dispatch(
      new UpdateMap(map, this.setupForm.controls['parcelIDs']?.dirty)
    );
    // 👉 this resets the dirty flag, disabling SAVE until
    //    additional data entered
    this.setupForm.form.markAsPristine();
  }
}
