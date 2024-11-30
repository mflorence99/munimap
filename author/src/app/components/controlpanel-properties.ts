import { RootPage } from '../pages//root/page';

import { AuthState } from '@lib/state/auth';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { ConfirmDialogComponent } from '@lib/components/confirm-dialog';
import { ConfirmDialogData } from '@lib/components/confirm-dialog';
import { Map } from '@lib/state/map';
import { MapActions } from '@lib/state/map';
import { MatDialog } from '@angular/material/dialog';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { Store } from '@ngxs/store';

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

        <button (click)="cancel()" mat-flat-button>Done</button>

        <button
          [disabled]="setupForm.invalid || !setupForm.dirty"
          color="primary"
          form="setupForm"
          mat-flat-button
          type="submit">
          Save
        </button>
      </mat-card-actions>
    </mat-card>
  `,
  styles: [
    `
      :host {
        display: block;
        pointer-events: auto;
      }

      .actions {
        display: flex;
        gap: 1rem;
        justify-content: flex-end;
        padding: 16px;

        button {
          min-width: 6rem;
        }
      }

      .card {
        overflow: hidden;
        position: relative;
        transition:
          width 0.25s,
          height 0.25s;
        width: 30rem;

        &.rolledup {
          height: 5rem;
          width: 5rem;
        }
      }

      .filler {
        flex-grow: 1;
      }

      .form {
        display: grid;
        gap: 1rem;
      }

      .instructions {
        margin-bottom: 1rem;
      }

      .rolledup {
        background-color: var(--mat-gray-800);
        border-radius: 0.25rem;
        cursor: pointer;
        padding: 1.15rem;

        .mat-mdc-card-header {
          padding: 0;
        }
      }
    `
  ],
  standalone: false
})
export class ControlPanelPropertiesComponent {
  mapCopy = computed(() => copy(this.mapState()));
  mapState = input<Map>();
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
      this.#root.setTitle(this.mapState().name);
      this.rolledup = !!this.mapState().id;
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
          this.#store.dispatch(new MapActions.DeleteMap(map.id));
          this.#router.navigate(['/create']);
        }
      });
  }

  update(map: Map): void {
    // 👇 refresh if parcelIDs have changed
    this.#store.dispatch(
      new MapActions.UpdateMap(map, this.ngForm().controls['parcelIDs']?.dirty)
    );
    // 👉 this resets the dirty flag, disabling SAVE until
    //    additional data entered
    this.ngForm().form.markAsPristine();
  }
}
