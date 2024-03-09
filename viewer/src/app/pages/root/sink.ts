import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';
import { Map } from '@lib/state/map';
import { User } from '@lib/state/auth';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-sink',
  template: ``,
  styles: [':host { display: none }']
})
export class SinkComponent {
  @Input() gps: boolean;
  @Input() map: Map;
  @Input() satelliteView: boolean;
  @Input() satelliteYear: string;
  @Input() user: User;
  @Input() zoom: number;
}
