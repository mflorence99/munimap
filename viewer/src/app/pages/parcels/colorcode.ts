import { ChangeDetectionStrategy } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { ColorCodeState } from '@lib/state/colorcode';
import { ColorCodeStateModel } from '@lib/state/colorcode';
import { Component } from '@angular/core';
import { DestroyService } from '@lib/services/destroy';
import { MatDrawer } from '@angular/material/sidenav';
import { NgForm } from '@angular/forms';
import { Observable } from 'rxjs';
import { OnInit } from '@angular/core';
import { Select } from '@ngxs/store';
import { SetColorCode } from '@lib/state/colorcode';
import { Store } from '@ngxs/store';
import { ViewChild } from '@angular/core';

import { takeUntil } from 'rxjs/operators';

import copy from 'fast-copy';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-parcels-colorcode',
  styleUrls: ['./colorcode.scss', '../../../../../lib/css/sidebar.scss'],
  templateUrl: './colorcode.html'
})
export class ParcelsColorCodeComponent implements OnInit {
  @Select(ColorCodeState) colorCode$: Observable<ColorCodeStateModel>;

  @ViewChild('setupForm', { static: true }) setupForm: NgForm;

  record: ColorCodeStateModel = ColorCodeState.defaultState();

  constructor(
    private cdf: ChangeDetectorRef,
    private destroy$: DestroyService,
    private drawer: MatDrawer,
    private store: Store
  ) {}

  cancel(): void {
    this.drawer.close();
  }

  ngOnInit(): void {
    this.#handleColorCode$();
  }

  save(record: ColorCodeStateModel): void {
    this.store.dispatch(new SetColorCode(record));
    this.drawer.close();
  }

  #handleColorCode$(): void {
    this.colorCode$.pipe(takeUntil(this.destroy$)).subscribe((state) => {
      this.record = copy(state);
      this.cdf.markForCheck();
    });
  }
}
