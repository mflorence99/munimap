import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';
import { Map } from '@lib/state/map';
import { User } from '@lib/state/auth';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-sink',
  template: ``
})
export class SinkComponent {
  @Input({ required: true }) gps: boolean;
  @Input({ required: true }) map: Map;
  @Input({ required: true }) satelliteView: boolean;
  @Input({ required: true }) satelliteYear: string;
  @Input({ required: true }) user: User;
  @Input({ required: true }) zoom: number;
}
