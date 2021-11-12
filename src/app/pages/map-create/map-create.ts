import { FilterFunction } from '../../ol/ol-interaction-select';
import { GeoJSONService } from '../../services/geojson';
import { Index } from '../../services/geojson';
import { Path } from '../../state/view';
import { RootPage } from '../root/root';
import { TownIndex } from '../../services/geojson';

import { theState } from '../../state/view';

import { ActivatedRoute } from '@angular/router';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Router } from '@angular/router';

import OLFeature from 'ol/Feature';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-map-create',
  styleUrls: ['./map-create.scss'],
  templateUrl: './map-create.html'
})
export class MapCreatePage {
  index: Index;
  now = Date.now();
  path: Path;

  constructor(
    private geoJSON: GeoJSONService,
    private root: RootPage,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.index = this.geoJSON.findIndex(this.route);
    this.path = this.route.snapshot.queryParamMap.get('path') ?? theState;
    this.root.setTitle(this.path);
  }

  atCountyLevel(path: Path): boolean {
    return path.split(':').length === 2;
  }

  atStateLevel(path: Path): boolean {
    return path.split(':').length === 1;
  }

  atTownLevel(path: Path): boolean {
    return path.split(':').length === 3;
  }

  currentCounty(): string {
    return this.path.split(':')[1];
  }

  currentState(): string {
    return this.path.split(':')[0];
  }

  currentTown(): string {
    return this.path.split(':')[2];
  }

  filter(): FilterFunction {
    return (feature: OLFeature<any>): boolean => {
      if (this.atCountyLevel(this.path)) {
        const townIndex = this.index[this.currentState()][this.currentCounty()][
          feature.getId()
        ] as TownIndex;
        return townIndex.layers.parcels.available;
      } else return true;
    };
  }

  onFeaturesSelected(features: OLFeature<any>[]): void {
    this.path += `:${features[0].getId()}`;
    this.root.setTitle(this.path);
  }

  onPathChanged(path: string): void {
    this.path = path;
    this.root.setTitle(this.path);
  }

  onPathSelected(path: string): void {
    this.router.navigate(['/town-map/0'], { queryParams: { path } });
  }
}
