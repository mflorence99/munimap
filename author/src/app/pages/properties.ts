import { RootPage } from './root/page';

import { Actions } from '@ngxs/store';
import { AuthState } from '@lib/state/auth';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { ConfirmDialogComponent } from '@lib/components/confirm-dialog';
import { ConfirmDialogData } from '@lib/components/confirm-dialog';
import { DeleteMap } from '@lib/state/map';
import { Descriptor } from '@lib/services/typeregistry';
import { DestroyService } from '@lib/services/destroy';
import { Input } from '@angular/core';
import { Map } from '@lib/state/map';
import { MatDialog } from '@angular/material/dialog';
import { MessageDialogComponent } from '@lib/components/message-dialog';
import { MessageDialogData } from '@lib/components/message-dialog';
import { NgForm } from '@angular/forms';
import { OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngxs/store';
import { TypeRegistry } from '@lib/services/typeregistry';
import { UpdateMap } from '@lib/state/map';
import { UpdateMapError } from '@lib/state/map';
import { ViewChild } from '@angular/core';

import { ofActionSuccessful } from '@ngxs/store';
import { takeUntil } from 'rxjs/operators';

import copy from 'fast-copy';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DestroyService],
  selector: 'app-properties',
  styleUrls: ['./properties.scss'],
  templateUrl: './properties.html'
})
export class PropertiesComponent implements OnInit {
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

  @ViewChild('setupForm', { static: true }) setupForm: NgForm;

  constructor(
    private actions$: Actions,
    private authState: AuthState,
    private destroy$: DestroyService,
    private dialog: MatDialog,
    public registry: TypeRegistry,
    private root: RootPage,
    private router: Router,
    private store: Store
  ) {}

  #handleActions$(): void {
    this.actions$
      .pipe(ofActionSuccessful(UpdateMapError), takeUntil(this.destroy$))
      .subscribe((action: UpdateMapError) => {
        const data: MessageDialogData = {
          message: action.error
        };
        this.dialog.open(MessageDialogComponent, { data });
      });
  }

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

  ngOnInit(): void {
    this.#handleActions$();
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
