import { ChangeDetectionStrategy } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { Component } from '@angular/core';
import { DestroyService } from '@lib/services/destroy';
import { MatDrawer } from '@angular/material/sidenav';
import { NgForm } from '@angular/forms';
import { Observable } from 'rxjs';
import { OnInit } from '@angular/core';
import { OverlayProperty } from '@lib/state/overlay';
import { OverlayState } from '@lib/state/overlay';
import { Select } from '@ngxs/store';
import { Store } from '@ngxs/store';
import { UpdateProperties } from '@lib/state/overlay';
import { ViewChild } from '@angular/core';

import { takeUntil } from 'rxjs/operators';

import copy from 'fast-copy';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DestroyService],
  selector: 'app-parcels-overlay',
  styleUrls: ['./overlay.scss', '../../../../../lib/css/sidebar.scss'],
  templateUrl: './overlay.html'
})
export class ParcelsOverlayComponent implements OnInit {
  #selectedProperty: [OverlayProperty, string];

  @Select(OverlayState) overlay$: Observable<OverlayProperty[]>;

  record: OverlayProperty[] = [];

  schema = OverlayState.schema();

  @ViewChild('setupForm', { static: true }) setupForm: NgForm;

  constructor(
    private cdf: ChangeDetectorRef,
    private destroy$: DestroyService,
    private drawer: MatDrawer,
    private store: Store
  ) {}

  #handleOverlay$(): void {
    this.overlay$.pipe(takeUntil(this.destroy$)).subscribe((properties) => {
      this.record = copy(properties);
      this.cdf.markForCheck();
    });
  }

  cancel(): void {
    this.drawer.close();
  }

  currentColor(): string {
    const [property, fld] = this.#selectedProperty ?? [];
    return property?.[fld] ?? '#FFFFFF';
  }

  isPicked([_property, _fld]): boolean {
    const [property, fld] = this.#selectedProperty ?? [];
    return property === _property && fld === _fld;
  }

  ngOnInit(): void {
    this.#handleOverlay$();
  }

  onColorPickerChange(color: string): void {
    const [property, fld] = this.#selectedProperty ?? [];
    if (property && fld) {
      property[fld] = color;
      this.setupForm.form.markAsDirty();
    }
  }

  onPropertyEnabled(property: OverlayProperty, state: boolean): void {
    property.enabled = state;
    this.setupForm.form.markAsDirty();
  }

  pick([property, fld]): void {
    this.#selectedProperty = [property, fld];
  }

  save(record: OverlayProperty[]): void {
    this.store.dispatch(new UpdateProperties(record));
    // 👉 this resets the dirty flag, disabling SAVE until
    //    additional data entered
    this.setupForm.form.markAsPristine();
  }

  trackByProp(ix: number, property: OverlayProperty): string {
    return property.attribute;
  }
}
