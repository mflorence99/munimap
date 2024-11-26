import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-version-dialog',
  template: `
    <h1 mat-dialog-title>New version detected</h1>

    <article mat-dialog-content>Please activate it now</article>

    <article mat-dialog-actions>
      <button [mat-dialog-close]="false" mat-flat-button>LATER</button>
      <button [mat-dialog-close]="true" color="primary" mat-flat-button>
        ACTIVATE
      </button>
    </article>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 30rem;
      }
    `
  ],
  standalone: false
})
export class VersionDialogComponent {}
