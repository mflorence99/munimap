import { ChangeDetectionStrategy } from "@angular/core";
import { Component } from "@angular/core";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";

import { inject } from "@angular/core";

export interface MessageDialogData {
  message: string;
}

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: "app-message-dialog",
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
    ],
    standalone: false
})
export class MessageDialogComponent {
  data: MessageDialogData = inject(MAT_DIALOG_DATA);
}
