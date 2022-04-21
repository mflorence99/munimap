import { ChangeDetectionStrategy } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Input } from '@angular/core';

import { from } from 'rxjs';
import { timeout } from 'rxjs/operators';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-easytrails',
  styleUrls: ['./controlpanel.scss'],
  templateUrl: './easytrails.html'
})
export class EasyTrailsComponent {
  invalidSharingURL = false;

  record = {
    sharingURL: ''
  };

  rolledup = true;

  @Input() validationTimeout = 250 /* 👈 ms */;

  constructor(private cdf: ChangeDetectorRef, private http: HttpClient) {}

  import(record: any): void {
    // 👀 https://stackoverflow.com/questions/47345282
    from(
      fetch(record.sharingURL, {
        method: 'GET',
        mode: 'no-cors'
      })
    )
      .pipe(timeout(this.validationTimeout))
      .subscribe({
        error: () => {
          this.invalidSharingURL = true;
          this.cdf.markForCheck();
        },
        next: () => (this.invalidSharingURL = false)
      });
  }
}
