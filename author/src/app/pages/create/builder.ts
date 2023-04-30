import { ActivatedRoute } from '@angular/router';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { EventEmitter } from '@angular/core';
import { GeoJSONService } from '@lib/services/geojson';
import { Index } from '@lib/common';
import { Input } from '@angular/core';
import { Output } from '@angular/core';
import { Path } from '@lib/state/view';
import { TownIndex } from '@lib/common';

import { isIndex } from '@lib/common';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-builder',
  styleUrls: ['./builder.scss'],
  templateUrl: './builder.html'
})
export class BuilderComponent {
  @Input() path: Path;

  @Output() pathChanged = new EventEmitter<Path>();
  @Output() pathSelected = new EventEmitter<Path>();

  @Input() type: string;

  @Output() typeChanged = new EventEmitter<string>();

  index: Index;

  constructor(private geoJSON: GeoJSONService, private route: ActivatedRoute) {
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
    return (
      Object.keys(this.index[state][county] ?? {})
        .filter(isIndex)
        // 👉 parcels MUST be available for parcels map
        .filter((town) => {
          const townIndex = this.index[state][county][town] as TownIndex;
          return this.type !== 'parcels' || townIndex.layers.parcels.available;
        })
        .sort()
    );
  }

  currentCounty(): string {
    return this.path?.split(':')[1];
  }

  currentState(): string {
    return this.path?.split(':')[0];
  }

  currentTown(): string {
    return this.path?.split(':')[2];
  }

  currentType(): string {
    return this.type;
  }

  reset(): void {
    this.pathChanged.emit(this.currentState());
  }

  submit(): void {
    this.pathSelected.emit(this.path);
  }

  switchCounty(county: string): void {
    this.pathChanged.emit(`${this.currentState()}:${county}`);
  }

  switchState(state: string): void {
    this.pathChanged.emit(`${state}`);
  }

  switchTown(town: string): void {
    this.pathChanged.emit(
      `${this.currentState()}:${this.currentCounty()}:${town}`
    );
  }

  switchType(type: string): void {
    this.type = type;
    this.typeChanged.emit(this.currentType());
  }

  trackByItem(ix: number, item: string): string {
    return item;
  }
}
