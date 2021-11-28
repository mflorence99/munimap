import { ChangeDetectionStrategy } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { Component } from '@angular/core';
import { DestroyService } from '@lib/services/destroy';
import { MatDrawer } from '@angular/material/sidenav';
import { NgForm } from '@angular/forms';
import { Observable } from 'rxjs';
import { OnInit } from '@angular/core';
import { OverlayProperties } from '@lib/state/overlay';
import { OverlayState } from '@lib/state/overlay';
import { Select } from '@ngxs/store';
import { ViewChild } from '@angular/core';

import { takeUntil } from 'rxjs/operators';

interface PropertiesRecord {
  attribute: string;
  caption: string;
  enabled: boolean;
  fill: string;
  stroke: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DestroyService],
  selector: 'app-setup',
  styleUrls: ['./setup.scss', './sidebar.scss'],
  templateUrl: './setup.html'
})
export class SetupComponent implements OnInit {
  @Select(OverlayState) overlay$: Observable<OverlayProperties[]>;

  record: PropertiesRecord[] = [];

  @ViewChild('setupForm', { static: true }) setupForm: NgForm;

  constructor(
    private cdf: ChangeDetectorRef,
    private destroy$: DestroyService,
    private drawer: MatDrawer
  ) {}

  #handleOverlay$(): void {
    this.overlay$
      .pipe(takeUntil(this.destroy$))
      .subscribe((properties) => this.#makeRecord(properties));
  }

  #makeRecord(properties: OverlayProperties[]): void {
    this.record = properties.map((property, ix) => {
      // 👉 the schema array is in lock-step with the properties
      const schema = OverlayState.schema()[ix];
      return { ...property, caption: schema.caption };
    });
    this.cdf.markForCheck();
  }

  done(): void {
    this.drawer.close();
  }

  ngOnInit(): void {
    this.#handleOverlay$();
  }

  save(record: PropertiesRecord[]): void {
    console.log({ record });
    // 👉 this resets the dirty flag, disabling SAVE until
    //    additional data entered
    this.setupForm.form.markAsPristine();
  }

  trackByProp(ix: number, property: PropertiesRecord): string {
    return property.attribute;
  }
}
