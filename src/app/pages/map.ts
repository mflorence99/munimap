import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-map',
  styleUrls: ['./map.scss'],
  templateUrl: './map.html'
})
export class MapPage {}
