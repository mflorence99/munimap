import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface MessageDialogData {
  message: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-message-dialog',
  template: `
    <p mat-dialog-content>{{ data.message }}</p>

    <article mat-dialog-actions>
      <button [mat-dialog-close]="true" color="primary" mat-flat-button>
        OK
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
  ]
})
export class MessageDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: MessageDialogData) {}
}
