import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-maps',
  styleUrls: ['./maps.scss'],
  templateUrl: './maps.html'
})
export class MapsPage {}
