import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-dummy1',
  template: '<p>Dummy page #1</p>'
})
export class Dummy1Page {}
