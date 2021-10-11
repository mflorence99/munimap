import { ActivatedRoute } from '@angular/router';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-map',
  styleUrls: ['./map.scss'],
  templateUrl: './map.html'
})
export class MapPage {
  boundary: GeoJSON.FeatureCollection;

  constructor(route: ActivatedRoute) {
    this.boundary = route.snapshot.data.boundary;
  }
}
