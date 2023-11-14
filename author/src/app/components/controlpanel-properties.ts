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
  template: `
    <mat-card appearance="outlined" [class.rolledup]="rolledup" class="card">
      <mat-card-header>
        <img
          (click)="rolledup = !rolledup"
          mat-card-avatar
          src="assets/favicon.svg" />

        <mat-card-title>Identify Your Map</mat-card-title>
        <mat-card-subtitle>
          Name will appear on printed version
        </mat-card-subtitle>
      </mat-card-header>

      <mat-card-content>
        <form
          #setupForm="ngForm"
          (keydown.escape)="cancel()"
          (submit)="update(map)"
          class="form"
          id="setupForm"
          novalidate
          spellcheck="false">
          <mat-form-field>
            <mat-label>Give your map a name</mat-label>
            <input
              #name="ngModel"
              [(ngModel)]="map.name"
              [appAutoFocus]="!rolledup"
              [appSelectOnFocus]="true"
              autocomplete="off"
              matInput
              name="name"
              placeholder="eg: My Old Town"
              required />
            @if (name.errors) {
              <mat-error>A map name is required</mat-error>
            }
          </mat-form-field>

          <mat-form-field>
            <mat-label>Assign an unique ID to your map</mat-label>
            <input
              #id="ngModel"
              [(ngModel)]="map.id"
              [appSelectOnFocus]="true"
              [disabled]="!map.isDflt"
              autocomplete="off"
              matInput
              name="id"
              pattern="[a-z0-9-_]+"
              placeholder="eg: myoldtown"
              required />
            @if (id.errors) {
              <mat-error>
                Use only lowercase letters and numbers, plus dash and underscore
              </mat-error>
            }
            @if (!id.errors) {
              <mat-hint>
                Viewer app URL:
                <em>https://{{ map.id }}.munimap.online</em>
              </mat-hint>
            }
          </mat-form-field>
        </form>
      </mat-card-content>

      <mat-card-actions class="actions">
        @if (canDelete()) {
          <a (click)="delete(map)" mat-flat-button>Delete ths map &hellip;</a>
        }

        <div class="filler"></div>

        <button (click)="cancel()" mat-flat-button>CANCEL</button>

        <button
          [disabled]="setupForm.invalid || !setupForm.dirty"
          color="primary"
          form="setupForm"
          mat-flat-button
          type="submit">
          SAVE
        </button>
      </mat-card-actions>
    </mat-card>
  `,
  styleUrls: ['./controlpanel.scss']
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
