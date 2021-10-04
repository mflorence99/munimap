import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-dummy2',
  template: '<p>Dummy page #2</p>'
})
export class Dummy2Page {}
