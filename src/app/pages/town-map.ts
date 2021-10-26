import { Map } from '../state/map';
import { OLMapComponent } from '../ol/ol-map';
import { Parcel } from '../state/parcel';
import { Path } from '../state/view';
import { RootPage } from '../root';

import { theState } from '../state/view';

import { ActivatedRoute } from '@angular/router';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { ViewChild } from '@angular/core';

import OLFeature from 'ol/Feature';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-town-map',
  styleUrls: ['./town-map.scss'],
  templateUrl: './town-map.html'
})
export class TownMapPage {
  map: Map;
  path: Path;

  @ViewChild(OLMapComponent) theMap;

  constructor(private root: RootPage, private route: ActivatedRoute) {
    // 👌 we resally want to read the map by its ID from Firebase
    //    but we are hacking it for now with a skeleton
    this.path = this.route.snapshot.queryParamMap.get('path') ?? theState;
    this.map = {
      id: null,
      name: null,
      path: this.path,
      style: 'blank'
    };
    this.root.setTitle(this.path);
  }

  onFeaturesSelected(features: OLFeature<any>[]): void {
    console.log(features.map((feature) => feature.getId()).join(','));
  }

  onParcelsFound(parcels: Parcel[]): void {
    this.theMap.selector.selectFeaturesFromProps(parcels);
  }
}
