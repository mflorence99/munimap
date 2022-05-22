import { ChangeDetectionStrategy } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { Component } from '@angular/core';
import { EasyTrailsService } from '@lib/services/easytrails';

// 🔥 this doesn't work, because of CORS and mixed-content issues

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-controlpanel-easytrails',
  styleUrls: ['./controlpanel.scss'],
  templateUrl: './controlpanel-easytrails.html'
})
export class ControlPanelEasyTrailsComponent {
  invalidURL = false;

  record = {
    url: ''
  };

  rolledup = true;
  validating = false;

  constructor(
    private cdf: ChangeDetectorRef,
    private easytrails: EasyTrailsService
  ) {
    this.record.url = this.easytrails.lastUsedURL;
  }

  cancel(): void {
    this.invalidURL = false;
    this.rolledup = true;
  }

  // 👇 we're just testing the URL here and kicking off the import
  //    we'll do the actual import in the sidebar

  validate(url: string): void {
    this.validating = true;
    this.easytrails.validate(url).subscribe({
      error: () => {
        this.invalidURL = true;
        this.validating = false;
        this.cdf.markForCheck();
      },
      next: () => {
        this.invalidURL = false;
        this.validating = false;
        this.cdf.markForCheck();
        // 🔥 TESTING
        this.easytrails.listTracks().subscribe(console.log);
      }
    });
  }
}
