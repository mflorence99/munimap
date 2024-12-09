import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { ConfirmDialogComponent } from '@lib/components/confirm-dialog';
import { ConfirmDialogData } from '@lib/components/confirm-dialog';
import { Map } from '@lib/state/map';
import { MapActions } from '@lib/state/map';
import { MatDialog } from '@angular/material/dialog';
import { MatDrawer } from '@angular/material/sidenav';
import { NgForm } from '@angular/forms';
import { Profile } from '@lib/state/auth';
import { Router } from '@angular/router';
import { Store } from '@ngxs/store';

import { computed } from '@angular/core';
import { inject } from '@angular/core';
import { input } from '@angular/core';
import { viewChild } from '@angular/core';

import copy from 'fast-copy';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-map-properties',
  template: `
    <header class="header">
      <img class="icon" role="none" src="assets/favicon.svg" />
      <p class="title">Identify Map</p>
      <p class="subtitle">Name will appear on printed version</p>
    </header>

    <form
      #propertiesForm="ngForm"
      (keydown.escape)="cancel()"
      (submit)="update(mapCopy())"
      class="form"
      id="propertiesForm"
      novalidate
      spellcheck="false">
      <mat-form-field>
        <mat-label>Give your map a name</mat-label>
        <input
          #name="ngModel"
          [(ngModel)]="mapCopy().name"
          [appAutoFocus]="true"
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
            <a href="https://{{ mapCopy().id }}.munimap.online" target="_blank">
              <em>https://{{ mapCopy().id }}.munimap.online</em>
            </a>
          </mat-hint>
        }
      </mat-form-field>
    </form>

    <article class="actions">
      @if (canDelete()) {
        <a (click)="delete(mapCopy())" mat-flat-button>
          Delete ths map &hellip;
        </a>
      }

      <div class="filler"></div>

      <button (click)="cancel()" mat-flat-button>Done</button>

      <button
        [disabled]="propertiesForm.invalid || !propertiesForm.dirty"
        color="primary"
        form="propertiesForm"
        mat-flat-button
        type="submit">
        Save
      </button>
    </article>
  `,
  standalone: false
})
export class MapPropertiesComponent {
  mapCopy = computed(() => copy(this.mapState()));
  mapState = input<Map>();
  ngForm = viewChild<NgForm>('propertiesForm');
  profile = input<Profile>();

  #dialog = inject(MatDialog);
  #drawer = inject(MatDrawer);
  #router = inject(Router);
  #store = inject(Store);

  canDelete(): boolean {
    return this.mapCopy().id && this.mapCopy().owner === this.profile().email;
  }

  cancel(): void {
    this.#drawer.close();
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
          this.#store.dispatch(new MapActions.DeleteMap(map.id));
          this.#router.navigate(['/create']);
        }
      });
  }

  update(map: Map): void {
    this.#store.dispatch(new MapActions.UpdateMap(map, true));
    // 👉 this resets the dirty flag, disabling SAVE until
    //    additional data entered
    this.ngForm().form.markAsPristine();
  }
}
