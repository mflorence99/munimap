import { Params } from '../services/params';

import nh from '../../assets/nh.json';

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { MapOptions } from 'leaflet';

import { geoJSON } from 'leaflet';
import { latLng } from 'leaflet';
import { tileLayer } from 'leaflet';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-map',
  styleUrls: ['./map.scss'],
  templateUrl: './map.html'
})
export class MapPage {
  layersControl = {
    baseLayers: {
      /* eslint-disable @typescript-eslint/naming-convention */
      'OpenStreetMap': tileLayer(
        'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          maxZoom: 18,
          attribution: '...'
        }
      ),
      'MapBox Satellite': tileLayer(
        'https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}',
        {
          attribution:
            'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
          maxZoom: 18,
          id: 'mapbox/satellite-v9',
          tileSize: 512,
          zoomOffset: -1,
          accessToken: this.params.mapbox.apiKey
        }
      ),
      'Hillshade': tileLayer('/topo/arcgis/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '...'
      }),
      'Google Streets': tileLayer(
        'http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
        {
          maxZoom: 20,
          subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
        }
      ),
      'Google Hybrid': tileLayer(
        'http://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}',
        {
          maxZoom: 20,
          subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
        }
      ),
      'Google Satellite': tileLayer(
        'http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
        {
          maxZoom: 20,
          subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
        }
      ),
      'Google Terrain': tileLayer(
        'http://{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
        {
          maxZoom: 20,
          subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
        }
      )
    },
    overlays: {
      'New Hampshire': geoJSON(nh as any, {
        style: { fill: false, stroke: false }
      })
    }
    /* eslint-enable @typescript-eslint/naming-convention */
  };

  options: MapOptions = {
    zoom: 11,
    center: latLng(43.1939, -71.5724)
  };

  constructor(private params: Params) {}
}
