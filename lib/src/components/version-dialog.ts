import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-version-dialog',
  styleUrls: ['./version-dialog.scss'],
  templateUrl: './version-dialog.html'
})
export class VersionDialogComponent {}
