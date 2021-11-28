import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { MatDrawer } from '@angular/material/sidenav';
import { NgForm } from '@angular/forms';
import { ViewChild } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-setup',
  styleUrls: ['./setup.scss', './sidebar.scss'],
  templateUrl: './setup.html'
})
export class SetupComponent {
  @ViewChild('setupForm', { static: true }) propertiesForm: NgForm;

  constructor(private drawer: MatDrawer) {}

  done(): void {
    this.drawer.close();
  }

  save(): void {}
}
