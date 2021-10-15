import { GeoJSONService } from '../services/geojson';
import { Index } from '../services/geojson';
import { SetCurrentPath } from '../state/view';
import { View } from '../state/view';
import { ViewState } from '../state/view';

import { isIndex } from '../services/geojson';

import { ActivatedRoute } from '@angular/router';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';
import { Navigate } from '@ngxs/router-plugin';
import { Store } from '@ngxs/store';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-map-filter',
  styleUrls: ['./map-filter.scss'],
  templateUrl: './map-filter.html'
})
export class MapFilterComponent {
  index: Index;

  @Input() view: View;

  constructor(
    private geoJSON: GeoJSONService,
    private route: ActivatedRoute,
    private store: Store
  ) {
    this.index = this.geoJSON.findIndex(this.route);
  }

  allCounties(): string[] {
    const state = this.currentState();
    return Object.keys(this.index[state]).filter(isIndex).sort();
  }

  allStates(): string[] {
    return Object.keys(this.index).filter(isIndex).sort();
  }

  allTowns(): string[] {
    const state = this.currentState();
    const county = this.currentCounty();
    return Object.keys(this.index[state][county] ?? {})
      .filter(isIndex)
      .sort();
  }

  currentCounty(): string {
    return ViewState.splitPath(this.view.path)[1];
  }

  currentState(): string {
    return ViewState.splitPath(this.view.path)[0];
  }

  currentTown(): string {
    return ViewState.splitPath(this.view.path)[2];
  }

  next(): void {
    this.store.dispatch(new Navigate(['/map/0']));
  }

  reset(): void {
    this.store.dispatch(new SetCurrentPath(this.currentState()));
  }

  switchCounty(county: string): void {
    const path = ViewState.joinPath([this.currentState(), county]);
    this.store.dispatch(new SetCurrentPath(path));
  }

  switchTown(town: string): void {
    const path = ViewState.joinPath([
      this.currentState(),
      this.currentCounty(),
      town
    ]);
    this.store.dispatch(new SetCurrentPath(path));
  }
}
