import { GeoJSONService } from '../services/geojson';
import { View } from '../state/map';

import { ActivatedRoute } from '@angular/router';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { ElementRef } from '@angular/core';
import { Input } from '@angular/core';
import { OnInit } from '@angular/core';

import { fromLonLat } from 'ol/proj';

import OLMap from 'ol/Map';
import OLOSM from 'ol/source/OSM';
import OLTile from 'ol/layer/Tile';
import OLView from 'ol/View';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-map',
  template: '<ng-content></ng-content>',
  styles: [
    `
      :host {
        background: url('/assets/halftone.svg');
        display: block;
        height: 100%;
        width: 100%;
      }
    `
  ]
})
export class OLMapComponent implements OnInit {
  boundary: GeoJSON.FeatureCollection<GeoJSON.Polygon>;
  olMap: OLMap;
  projection = 'EPSG:3857';
  @Input() view: View;

  constructor(
    private geoJSON: GeoJSONService,
    private host: ElementRef,
    private route: ActivatedRoute
  ) {
    this.olMap = new OLMap({});
  }

  ngOnInit(): void {
    this.geoJSON
      .loadByIndex(this.route, 'NEW HAMPSHIRE', 'boundary')
      .subscribe((boundary: GeoJSON.FeatureCollection<GeoJSON.Polygon>) => {
        // HACK
        const bbox = boundary.features[0].bbox;
        const [minX, minY, maxX, maxY] = bbox;
        const olView = new OLView({
          center: fromLonLat([
            minX + (maxX - minX) / 2,
            minY + (maxY - minY) / 2
          ]),
          zoom: 13
        });
        this.olMap.setTarget(this.host.nativeElement);
        this.olMap.setView(olView);
        // hacks
        this.olMap.addLayer(new OLTile({ source: new OLOSM() }));
      });
  }
}
