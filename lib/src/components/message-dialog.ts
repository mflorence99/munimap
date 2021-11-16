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
  styleUrls: ['./message-dialog.scss'],
  templateUrl: './message-dialog.html'
})
export class MessageDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: MessageDialogData) {}
}
