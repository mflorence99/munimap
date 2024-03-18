import { RootPage } from '../pages//root/page';

import { AuthState } from '@lib/state/auth';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { ConfirmDialogComponent } from '@lib/components/confirm-dialog';
import { ConfirmDialogData } from '@lib/components/confirm-dialog';
import { DeleteMap } from '@lib/state/map';
import { Map } from '@lib/state/map';
import { MatDialog } from '@angular/material/dialog';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { Store } from '@ngxs/store';
import { UpdateMap } from '@lib/state/map';

import { computed } from '@angular/core';
import { effect } from '@angular/core';
import { inject } from '@angular/core';
import { input } from '@angular/core';
import { viewChild } from '@angular/core';

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
          (submit)="update(mapCopy())"
          class="form"
          id="setupForm"
          novalidate
          spellcheck="false">
          <mat-form-field>
            <mat-label>Give your map a name</mat-label>
            <input
              #name="ngModel"
              [(ngModel)]="mapCopy().name"
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
              [(ngModel)]="mapCopy().id"
              [appSelectOnFocus]="true"
              [disabled]="!mapCopy().isDflt"
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
                <a
                  href="https://{{ mapCopy().id }}.munimap.online"
                  target="_blank">
                  <em>https://{{ mapCopy().id }}.munimap.online</em>
                </a>
              </mat-hint>
            }
          </mat-form-field>
        </form>
      </mat-card-content>

      <mat-card-actions class="actions">
        @if (canDelete()) {
          <a (click)="delete(mapCopy())" mat-flat-button>
            Delete ths map &hellip;
          </a>
        }

        <div class="filler"></div>

        <button (click)="cancel()" mat-flat-button>DONE</button>

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
  styleUrls: ['./abstract-controlpanel.scss']
})
export class ControlPanelPropertiesComponent {
  map = input<Map>();
  mapCopy = computed(() => copy(this.map()));
  ngForm = viewChild<NgForm>('setupForm');
  rolledup: boolean;

  #authState = inject(AuthState);
  #dialog = inject(MatDialog);
  #root = inject(RootPage);
  #router = inject(Router);
  #store = inject(Store);

  constructor() {
    effect(() => {
      // 👉 set the window title every time it changes
      this.#root.setTitle(this.map().name);
      this.rolledup = !!this.map().id;
    });
  }

  canDelete(): boolean {
    return (
      this.mapCopy().id &&
      this.mapCopy().owner === this.#authState.currentProfile().email
    );
  }

  cancel(): void {
    this.rolledup = true;
  }

  delete(map: Map): void {
    const data: ConfirmDialogData = {
      content:
        'The map will be permanently deleted, but any changes made to parcels will be kept for use in other maps.',
      title: 'Please confirm map deletion'
    };
    this.#dialog
      .open(ConfirmDialogComponent, { data })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          this.#store.dispatch(new DeleteMap(map.id));
          this.#router.navigate(['/create']);
        }
      });
  }

  update(map: Map): void {
    // 👇 refresh if parcelIDs have changed
    this.#store.dispatch(
      new UpdateMap(map, this.ngForm().controls['parcelIDs']?.dirty)
    );
    // 👉 this resets the dirty flag, disabling SAVE until
    //    additional data entered
    this.ngForm().form.markAsPristine();
  }
}
