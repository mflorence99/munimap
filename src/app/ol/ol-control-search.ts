import { OLMapComponent } from './ol-map';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-control-search',
  templateUrl: './ol-control-search.html',
  styleUrls: ['./ol-control-search.scss']
})
export class OLControlSearchComponent {
  constructor(private map: OLMapComponent) {}
}
