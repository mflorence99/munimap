import { GeoJSONService } from '../services/geojson';
import { Index } from '../services/geojson';

import { ActivatedRoute } from '@angular/router';
import { AfterViewInit } from '@angular/core';
import { Component } from '@angular/core';
import { ElementRef } from '@angular/core';
import { Input } from '@angular/core';

import { fromLonLat } from 'ol/proj';
import { transformExtent } from 'ol/proj';

import Colorize from 'ol-ext/filter/Colorize';
import copy from 'fast-copy';
import Crop from 'ol-ext/filter/Crop';
import Feature from 'ol/Feature';
import GeoJSON from 'ol/format/GeoJSON';
import Map from 'ol/Map';
import OSM from 'ol/source/OSM';
import Polygon from 'ol/geom/Polygon';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import View from 'ol/View';

@Component({
  selector: 'app-ol-map',
  templateUrl: './ol-map.html',
  styleUrls: ['./ol-map.scss']
})
export class OLMapComponent implements AfterViewInit {
  @Input() boundary: GeoJSON.FeatureCollection;
  index: Index = this.route.parent.snapshot.data.index;
  map: Map;
  projection = 'EPSG:3857';

  // 👇 all hacks for now

  constructor(
    private geoJSON: GeoJSONService,
    private host: ElementRef,
    private route: ActivatedRoute
  ) {}

  ngAfterViewInit(): void {
    const bbox = this.boundary.features[0].bbox;
    const projection = this.boundary.features[0].properties.projection;
    const zoom = this.boundary.features[0].properties.zoom;
    const [minX, minY, maxX, maxY] = bbox;

    const bg = new TileLayer({
      source: new OSM()
    });

    const grayscale = new Colorize({
      active: true,
      operation: 'hue',
      color: [0, 0, 0],
      value: 1
    });
    // 👇 he's monkey-patched addFilter
    bg['addFilter'](grayscale);

    const base = new TileLayer({
      source: new OSM()
    });

    const coords = copy(this.boundary.features[0].geometry['coordinates']);
    const feature = new Feature(new Polygon(coords));
    feature.getGeometry().transform(projection, this.projection);
    const crop = new Crop({
      active: true,
      feature: feature,
      inner: false
    });
    // 👇 he's monkey-patched addFilter
    base['addFilter'](crop);

    const view = new View({
      center: fromLonLat([minX + (maxX - minX) / 2, minY + (maxY - minY) / 2]),
      extent: transformExtent(bbox, projection, this.projection),
      maxZoom: zoom,
      minZoom: zoom,
      zoom: zoom
    });

    this.map = new Map({
      view: view,
      layers: [bg, base],
      target: this.host.nativeElement
    });

    this.geoJSON.load(this.index.towns).subscribe((towns) => {
      const outline = new VectorLayer({
        source: new VectorSource({
          features: new GeoJSON().readFeatures(towns, {
            featureProjection: projection
          })
        })
      });
      this.map.addLayer(outline);
      outline.changed();
    });
  }
}
