import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-dummy',
  styleUrls: ['./dummy.scss'],
  templateUrl: './dummy.html'
})
export class DummyPage {}
