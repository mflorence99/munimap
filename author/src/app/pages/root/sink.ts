import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';
import { Map } from '@lib/state/map';
import { Profile } from '@lib/state/auth';
import { User } from '@lib/state/auth';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-sink',
  template: ``
})
export class SinkComponent {
  @Input({ required: true }) map: Map;
  @Input({ required: true }) profile: Profile;
  @Input({ required: true }) satelliteView: boolean;
  @Input({ required: true }) user: User;
}
