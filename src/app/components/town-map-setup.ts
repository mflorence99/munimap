import { DestroyService } from '../services/destroy';
import { GeoJSONService } from '../services/geojson';
import { Index } from '../services/geojson';
import { Map } from '../state/map';
import { MapState } from '../state/map';
import { SaveMap } from '../state/map';
import { UpdateMap } from '../state/map';
import { View } from '../state/view';

import { ActivatedRoute } from '@angular/router';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { FormGroup } from '@angular/forms';
import { Input } from '@angular/core';
import { Observable } from 'rxjs';
import { Select } from '@ngxs/store';
import { Store } from '@ngxs/store';
import { Validators } from '@angular/forms';

import { takeUntil } from 'rxjs/operators';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DestroyService],
  selector: 'app-town-map-setup',
  styleUrls: ['./town-map-setup.scss'],
  templateUrl: './town-map-setup.html'
})
export class TownMapSetupComponent {
  index: Index;

  @Select(MapState) map$: Observable<Map>;

  setupForm: FormGroup;

  @Input() view: View;

  constructor(
    private destroy$: DestroyService,
    private formBuilder: FormBuilder,
    private geoJSON: GeoJSONService,
    private route: ActivatedRoute,
    private store: Store
  ) {
    this.index = this.geoJSON.findIndex(this.route);
    this.#initialize();
    this.#handleMap$();
    this.#handleValueChanges$();
  }

  #handleMap$(): void {
    this.map$.subscribe((map: Map) => {
      this.#populate(map);
    });
  }

  #handleValueChanges$(): void {
    this.setupForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((setupForm) => {
        this.store.dispatch(new UpdateMap(setupForm));
      });
  }

  #initialize(): void {
    this.setupForm = this.formBuilder.group({
      id: null,
      name: [null, Validators.required],
      style: null
    });
  }

  #populate(map: Map): void {
    this.setupForm.patchValue(
      {
        id: map.id,
        name: map.name,
        style: map.style
      },
      { emitEvent: false }
    );
  }

  submit(): void {
    this.store.dispatch(new SaveMap());
  }
}
