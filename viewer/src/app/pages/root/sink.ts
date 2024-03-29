import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';
import { Map } from '@lib/state/map';
import { ParcelCoding } from '@lib/state/view';
import { User } from '@lib/state/auth';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-sink',
  template: ``,
  styles: [':host { display: none }']
})
export class SinkComponent {
  // 👇 @Input works just fine here!

  @Input() gps: boolean;
  @Input() mapState: Map;
  @Input() parcelCoding: ParcelCoding;
  @Input() satelliteView: boolean;
  @Input() satelliteYear: string;
  @Input() streetFilter: string;
  @Input() user: User;
  @Input() zoom: number;
}
