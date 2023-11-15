import { ChangeDetectionStrategy } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { Component } from '@angular/core';
import { EasyTrailsService } from '@lib/services/easytrails';

// 🔥 this doesn't work, because of CORS and mixed-content issues

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-controlpanel-easytrails',
  template: `
    <mat-card appearance="outlined" [class.rolledup]="rolledup" class="card">
      <mat-card-header>
        <img
          (click)="rolledup = !rolledup"
          mat-card-avatar
          src="assets/easytrails.png" />

        <mat-card-title>
          Import from
          <a href="http://www.easytrailsgps.com/" target="_blank">EasyTrails</a>
        </mat-card-title>
        <mat-card-subtitle>Import landmarks from iPhone app.</mat-card-subtitle>
      </mat-card-header>

      <mat-card-content>
        <p class="instructions">
          First, open the EasyTrails app on your iPhone and press the share
          button,
          <a
            href="http://www.easytrailsgps.com/tutorials/how-to-export-and-analyze-tracks/"
            target="_blank">
            as described here
          </a>
          . Then enter the sharing URL below.
        </p>

        <form
          #sharingForm="ngForm"
          (keydown.escape)="cancel()"
          (submit)="validate(record.url)"
          class="form"
          id="sharingForm"
          novalidate
          spellcheck="false">
          <mat-form-field>
            <mat-label>EasyTrails Sharing URL</mat-label>
            <input
              #url="ngModel"
              (input)="invalidURL = false"
              [(ngModel)]="record.url"
              [appAutoFocus]="!rolledup"
              [appSelectOnFocus]="true"
              autocomplete="off"
              matInput
              name="url"
              placeholder="eg: http://192.168.1.13"
              required />
            @if (url.errors) {
              <mat-error>The sharing URL is required</mat-error>
            }
          </mat-form-field>
        </form>

        @if (invalidURL) {
          <p class="instructions">
            <fa-icon [icon]="['fad', 'circle-exclamation']"></fa-icon>
            Unable to connect to URL. Make sure that you have entered it
            correctly and that your computer is on the exact same network as
            your iPhone.
          </p>
        }
      </mat-card-content>

      <mat-card-actions class="actions">
        <button (click)="cancel()" mat-flat-button>CANCEL</button>
        <button
          [disabled]="sharingForm.invalid || validating"
          color="primary"
          form="sharingForm"
          mat-flat-button
          type="submit">
          @if (validating) {
            <fa-icon [icon]="['fas', 'spinner']" [spin]="true"></fa-icon>
          }
          @if (!validating) {
            <span>IMPORT</span>
          }
        </button>
      </mat-card-actions>
    </mat-card>
  `,
  styleUrls: ['./abstract-controlpanel.scss']
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
