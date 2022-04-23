import { ContextMenuComponent } from '../contextmenu-component';

import { AddParcels } from '@lib/state/parcels';
import { AuthState } from '@lib/state/auth';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Input } from '@angular/core';
import { MatDrawer } from '@angular/material/sidenav';
import { NgForm } from '@angular/forms';
import { OLMapComponent } from '@lib/ol/ol-map';
import { OnInit } from '@angular/core';
import { Parcel } from '@lib/common';
import { ParcelID } from '@lib/common';
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
  selector: 'app-subdivide-parcel',
  styleUrls: ['./subdivide-parcel.scss', '../../../../../lib/css/sidebar.scss'],
  templateUrl: './subdivide-parcel.html'
})
export class SubdivideParcelComponent implements ContextMenuComponent, OnInit {
  #format: OLGeoJSON;

  @Input() drawer: MatDrawer;

  @Input() features: OLFeature<any>[];

  @Input() map: OLMapComponent;

  @Input() selectedIDs: ParcelID[];

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
    const source = this.features[0];
    this.subdivisions = [
      {
        area: source.getProperties().area,
        id: `${source.getId()}`
      },
      {
        area: null,
        id: null
      }
    ];
  }

  refresh(): void {}

  // 👇 the idea is that subdivision is a two-part process
  //    first, right here, we subdivide into N random polygons
  //    then later the user will adjust the lot lines

  save(subdivisions: Subdivision[]): void {
    // 👉 trim out excess subdivisions
    while (!subdivisions[subdivisions.length - 1].id) subdivisions.length -= 1;
    // 👉 we need the bbox b/c we can only draw random points inside a box
    const bbox: any = transformExtent(
      this.features[0].getGeometry().getExtent(),
      this.map.projection,
      this.map.featureProjection
    );
    // 👉 there's guaranteed to be only one selected parcel
    const source = this.features[0];
    const sourceGeoJSON = JSON.parse(
      this.#format.writeFeature(this.features[0])
    );
    // 👉 keep creating voronoi ploygons until we have enough
    //    reason: a randpom point may fall outside the source
    let targetGeoJSONs = [];
    for (let ix = 0; targetGeoJSONs.length < subdivisions.length; ix++) {
      const randomPoints = randomPoint(subdivisions.length + ix, { bbox });
      targetGeoJSONs = voronoi(randomPoints, { bbox }).features.map((polygon) =>
        intersect(polygon, sourceGeoJSON)
      );
    }
    // 👉 trim any excess
    targetGeoJSONs.length = subdivisions.length;
    // 👉 if the source parcel ID is subsumed in the subdivision
    //    then we'll remove it
    const removedParcels: Parcel[] = [];
    if (
      subdivisions.every((subdivision) => subdivision.id !== source.getId())
    ) {
      removedParcels.push({
        action: 'removed',
        id: source.getId(),
        owner: this.authState.currentProfile().email,
        path: this.map.path,
        type: 'Feature'
      });
    }
    // 👉 create a new geometry for each subdivision
    const subdividedParcels: Parcel[] = targetGeoJSONs.map((geojson, ix) => {
      const props = source.getProperties();
      const subdivision = subdivisions[ix];
      return {
        action: subdivision.id !== source.getId() ? 'added' : 'modified',
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
        },
        type: 'Feature'
      };
    });
    // that's it!
    this.store.dispatch(
      new AddParcels([...removedParcels, ...subdividedParcels])
    );
    this.drawer.close();
  }

  trackByIndex(ix: number): number {
    return ix;
  }
}
