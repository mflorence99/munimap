import { Map } from '../state/map';
import { Path } from '../state/view';
import { RootPage } from '../root';

import { theState } from '../state/view';

import { ActivatedRoute } from '@angular/router';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-town-map',
  styleUrls: ['./town-map.scss'],
  templateUrl: './town-map.html'
})
export class TownMapPage {
  map: Map;
  path: Path;

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

  onSelectFeature(name: string): void {
    console.log(name);
  }
}
