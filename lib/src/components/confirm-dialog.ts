import { ChangeDetectionStrategy } from "@angular/core";
import { Component } from "@angular/core";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";

import { inject } from "@angular/core";

export interface ConfirmDialogData {
  content: string;
  title: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-confirm-dialog",
  template: `
    <h1 mat-dialog-title>{{ data.title }}</h1>

    <article mat-dialog-content>{{ data.content }}</article>

    <article mat-dialog-actions>
      <button [mat-dialog-close]="false" mat-flat-button>CANCEL</button>
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
  ],
  standalone: false
})
export class ConfirmDialogComponent {
  data: ConfirmDialogData = inject(MAT_DIALOG_DATA);
}
