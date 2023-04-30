import { RootPage } from '../root/page';

import { ActivatedRoute } from '@angular/router';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { FilterFunction } from '@lib/ol/ol-adaptor-geojson';
import { GeoJSONService } from '@lib/services/geojson';
import { Index } from '@lib/common';
import { OLLayerVectorComponent } from '@lib/ol/ol-layer-vector';
import { Path } from '@lib/state/view';
import { Router } from '@angular/router';
import { TownIndex } from '@lib/common';
import { ViewChild } from '@angular/core';

import { environment } from '@lib/environment';
import { theState } from '@lib/common';

import OLFeature from 'ol/Feature';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-create',
  styleUrls: ['./page.scss'],
  templateUrl: './page.html'
})
export class CreatePage {
  @ViewChild('selectables') selectables: OLLayerVectorComponent;

  env = environment;
  index: Index;
  path: Path;
  type = 'parcels';

  constructor(
    private geoJSON: GeoJSONService,
    private root: RootPage,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.index = this.geoJSON.findIndex(this.route);
    this.path = theState;
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
    return (name: string): boolean => {
      if (this.atCountyLevel(this.path)) {
        const townIndex = this.index[this.currentState()][this.currentCounty()][
          name
        ] as TownIndex;
        return this.type !== 'parcels' || townIndex?.layers.parcels.available;
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
    this.router.navigate([`/${this.type}/0`], { queryParams: { path } });
  }

  onTypeChanged(type: string): void {
    this.type = type;
    if (this.selectables) this.selectables.olLayer.getSource().refresh();
  }
}
