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
  @Select(OverlayState) overlay$: Observable<OverlayProperty[]>;

  @ViewChild('setupForm', { static: true }) setupForm: NgForm;

  record: OverlayProperty[] = [];

  schema = OverlayState.schema();

  #selectedProperty: [OverlayProperty, string];

  constructor(
    private cdf: ChangeDetectorRef,
    private destroy$: DestroyService,
    private drawer: MatDrawer,
    private store: Store
  ) {}

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

  // 👇 these gyrations are needed for when new overlay attributes are added
  #handleOverlay$(): void {
    // 👇 index the defaults
    const dfltByAttr = OverlayState.defaultState().reduce((acc, dflt) => {
      acc[dflt.attribute + dflt.value] = dflt;
      return acc;
    }, {});
    // 👇 handle changes in the overlay attributes
    //    adding in any defaults for new overlay attributes
    this.overlay$.pipe(takeUntil(this.destroy$)).subscribe((properties) => {
      const propByAttr = properties.reduce((acc, prop) => {
        acc[prop.attribute + prop.value] = prop;
        return acc;
      }, {});
      const combo = { ...dfltByAttr, ...propByAttr };
      console.log({ combo });
      this.record = copy(Object.values(combo));
      this.cdf.markForCheck();
    });
  }
}
