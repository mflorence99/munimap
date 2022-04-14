import { OLLayerTileComponent } from './ol-layer-tile';
import { OLMapComponent } from './ol-map';

import { environment } from '../environment';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Input } from '@angular/core';
import { OnInit } from '@angular/core';

import { forkJoin } from 'rxjs';

import OLXYZ from 'ol/source/XYZ';

// 🔥 this ALMOST works, but we can't figure out how to set the
//    "server" digit (e.g. "1" or "2") in the URL -- /MapServer/???/

const attribution =
  'Powered by <a href="https://granitview.unh.edu/html5viewer/index.html?viewer=granit_view" target="_blank">GRANIT<i>View</i></a>';

const HUCS = [
  '01040001',
  '01040002',
  '01060002',
  '01060003',
  '01070001',
  '01070002',
  '01070003' /* 👈 Washington */,
  '01070004',
  '01070006' /* 👈 Henniker */,
  '01080101',
  '01080103',
  '01080104',
  '01080106',
  '01080107',
  '01080201',
  '01080202'
];

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-source-contours-2ft',
  template: '<ng-content></ng-content>',
  styles: [':host { display: none }']
})
export class OLSourceContours2ftComponent implements OnInit {
  @Input() maxZoom: number;

  olXYZ: OLXYZ;

  constructor(
    private http: HttpClient,
    private layer: OLLayerTileComponent,
    private map: OLMapComponent
  ) {}

  ngOnInit(): void {
    const [minX, minY, maxX, maxY] = this.map.boundaryExtent;
    const url = `https://nhgeodata.unh.edu/nhgeodata/rest/services/EDP/LiDAR_Contours_2ft_XXXXXXXX_smooth_cached/MapServer/4/query?f=json&returnIdsOnly=true&returnCountOnly=true&where=1=1&returnGeometry=false&spatialRel=esriSpatialRelIntersects&geometry={"xmin":${minX},"ymin":${minY},"xmax":${maxX},"ymax":${maxY},"spatialReference":{"wkid":102100}}&geometryType=esriGeometryEnvelope&inSR=102100&outSR=102100`;
    const requests = HUCS.reduce((acc, huc) => {
      acc[huc] = this.http.get(url.replace('XXXXXXXX', huc));
      return acc;
    }, {});
    forkJoin(requests).subscribe((results: any) => {
      console.log(results);
      const huc = Object.keys(results).find((huc) => results[huc].count > 0);
      const url =
        'https://nhgeodata.unh.edu/nhgeodata/rest/services/EDP/LiDAR_Contours_2ft_XXXXXXXX_smooth_cached/MapServer/tile/{z}/{y}/{x}'.replace(
          'XXXXXXXX',
          huc
        );
      const parsed = new URL(url);
      const encoded = encodeURIComponent(url);
      this.olXYZ = new OLXYZ({
        attributions: [attribution],
        crossOrigin: 'anonymous',
        maxZoom: this.maxZoom,
        url: `${environment.endpoints.proxy}/proxy/${parsed.hostname}?url=${encoded}&x={x}&y={y}&z={z}`
      });
      this.layer.olLayer.setSource(this.olXYZ);
    });
  }
}
