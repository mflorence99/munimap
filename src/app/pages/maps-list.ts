import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-maps-list',
  styleUrls: ['./maps-list.scss'],
  templateUrl: './maps-list.html'
})
export class MapsListPage {}
