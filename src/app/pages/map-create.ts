import { Path } from '../state/view';

import { theState } from '../state/view';

import { ActivatedRoute } from '@angular/router';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-map-create',
  styleUrls: ['./map-create.scss'],
  templateUrl: './map-create.html'
})
export class MapCreatePage {
  path: Path;

  constructor(private route: ActivatedRoute, private router: Router) {
    this.path = this.route.snapshot.queryParamMap.get('path') ?? theState;
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

  onPathChanged(path: string): void {
    this.path = path;
  }

  onPathSelected(path: string): void {
    this.router.navigate(['/town-map/0'], { queryParams: { path } });
  }

  onSelectFeature(name: string): void {
    this.path += `:${name}`;
  }
}
