import { AddParcels } from '../state/parcels';
import { AuthState } from '../state/auth';
import { ContextMenuComponent } from './contextmenu-component';
import { OLMapComponent } from '../ol/ol-map';
import { Parcel } from '../common';
import { ParcelProperties } from '../common';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';
import { MatDrawer } from '@angular/material/sidenav';
import { NgForm } from '@angular/forms';
import { OnInit } from '@angular/core';
import { Store } from '@ngxs/store';
import { ViewChild } from '@angular/core';

import { randomPoint } from '@turf/random';
import { transformExtent } from 'ol/proj';

import intersect from '@turf/intersect';
import OLFeature from 'ol/Feature';
import OLGeoJSON from 'ol/format/GeoJSON';
import voronoi from '@turf/voronoi';

interface Subdivision {
  area: number;
  id: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-subdivide-parcels',
  styleUrls: ['./contextmenu-component.scss', './subdivide-parcel.scss'],
  templateUrl: './subdivide-parcel.html'
})
export class SubdivideParcelComponent implements ContextMenuComponent, OnInit {
  #features: OLFeature<any>[];
  #format: OLGeoJSON;

  @Input() drawer: MatDrawer;

  @Input()
  get features(): OLFeature<any>[] {
    return this.#features;
  }
  set features(features: OLFeature<any>[]) {
    this.#features = features;
    this.subdivisions = [
      {
        area: this.features[0].getProperties().area,
        id: `${this.features[0].getId()}`
      },
      {
        area: null,
        id: null
      }
    ];
  }

  @Input() map: OLMapComponent;

  @Input() selectedIDs: string[];

  @ViewChild('subdivisionForm', { static: true }) subdivisionForm: NgForm;

  subdivisions: Subdivision[];

  constructor(private authState: AuthState, private store: Store) {}

  cancel(): void {
    this.drawer.close();
  }

  more(): void {
    this.subdivisions.push({ area: null, id: null });
  }
  ngOnInit(): void {
    this.#format = new OLGeoJSON({
      dataProjection: this.map.featureProjection,
      featureProjection: this.map.projection
    });
  }

  save(subdivisions: Subdivision[]): void {
    while (!subdivisions[subdivisions.length - 1].id) subdivisions.length -= 1;

    const bbox: any = transformExtent(
      this.features[0].getGeometry().getExtent(),
      this.map.projection,
      this.map.featureProjection
    );

    const source = this.features[0];

    const sourceGeoJSON = JSON.parse(
      this.#format.writeFeature(this.features[0])
    );

    const randomPoints = randomPoint(subdivisions.length, { bbox });

    const targetGeoJSONs = voronoi(randomPoints, { bbox }).features.map(
      (polygon) => intersect(polygon, sourceGeoJSON)
    );

    const subdividedParcels: Parcel[] = targetGeoJSONs.map((geojson, ix) => {
      const props = source.getProperties();
      const subdivision = subdivisions[ix];
      return {
        added: subdivision.id !== source.getId() ? subdivision.id : null,
        geometry: geojson.geometry,
        id: subdivision.id,
        owner: this.authState.currentProfile().email,
        path: this.map.path,
        properties: {
          address: props.address,
          area: subdivision.area ?? 1,
          county: props.county,
          id: subdivision.id,
          neighborhood: props.neighborhood,
          owner: props.owner,
          town: props.town,
          usage: props.usage,
          use: props.use,
          zone: props.zone
        } as ParcelProperties,
        type: 'Feature'
      };
    });

    this.store.dispatch(new AddParcels(subdividedParcels));
    this.drawer.close();
  }

  trackByIndex(ix: number): number {
    return ix;
  }
}
