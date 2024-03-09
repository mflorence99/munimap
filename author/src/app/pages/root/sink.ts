import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';
import { Map } from '@lib/state/map';
import { Profile } from '@lib/state/auth';
import { User } from '@lib/state/auth';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-sink',
  template: ``,
  styles: [':host { display: none }']
})
export class SinkComponent {
  @Input() map: Map;
  @Input() profile: Profile;
  @Input() satelliteView: boolean;
  @Input() user: User;
}
