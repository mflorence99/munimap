import { DestroyService } from '../services/destroy';
import { OLMapComponent } from './ol-map';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

import { combineLatest } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

export interface PrintProgressData {
  map: OLMapComponent;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DestroyService],
  selector: 'ol-control-printprogress',
  styleUrls: ['./ol-control-printprogress.scss'],
  templateUrl: './ol-control-printprogress.html'
})
export class OLControlPrintProgressComponent {
  map: OLMapComponent;

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: PrintProgressData,
    private destroy$: DestroyService
  ) {
    this.map = data.map;
    this.#handleProgress$();
  }

  #handleProgress$(): void {
    combineLatest(this.map.progresses$)
      .pipe(takeUntil(this.destroy$))
      .subscribe(console.log);
  }
}
