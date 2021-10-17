import { Map } from '../state/map';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-town-map-setup',
  styleUrls: ['./town-map-setup.scss'],
  templateUrl: './town-map-setup.html'
})
export class TownMapSetupComponent {
  @Input() map: Map;

  submit(): void {
    // DO SAVE HERE
  }
}
