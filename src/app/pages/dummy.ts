import { GeoJSONService } from '../services/geojson';

import { ActivatedRoute } from '@angular/router';
import { AfterViewInit } from '@angular/core';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { ElementRef } from '@angular/core';

import { fromLonLat } from 'ol/proj';
import { pointerMove } from 'ol/events/condition';

import Colorize from 'ol-ext/filter/Colorize';
import copy from 'fast-copy';
import Crop from 'ol-ext/filter/Crop';
import Feature from 'ol/Feature';
import Fill from 'ol/style/Fill';
import GeoJSON from 'ol/format/GeoJSON';
import Map from 'ol/Map';
import OSM from 'ol/source/OSM';
import Polygon from 'ol/geom/Polygon';
import Select from 'ol/interaction/Select';
import Stroke from 'ol/style/Stroke';
import Style from 'ol/style/Style';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import View from 'ol/View';
import XYZ from 'ol/source/XYZ';

// 👇 all hacks for now

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-dummy',
  styleUrls: ['./dummy.scss'],
  templateUrl: './dummy.html'
})
export class DummyPage implements AfterViewInit {
  projection = 'EPSG:3857';

  constructor(
    private geoJSON: GeoJSONService,
    private host: ElementRef,
    private route: ActivatedRoute
  ) {}

  ngAfterViewInit(): void {
    this.geoJSON
      .loadByIndex(this.route, 'NEW HAMPSHIRE', 'boundary')
      .subscribe((boundary: GeoJSON.FeatureCollection<GeoJSON.Polygon>) => {
        const bbox = boundary.features[0].bbox;
        // 👉 TODO: ambient typings missing this
        const projection = boundary['crs'].properties.name;
        const [minX, minY, maxX, maxY] = bbox;

        const view = new View({
          center: fromLonLat([
            minX + (maxX - minX) / 2,
            minY + (maxY - minY) / 2
          ]),
          // extent: transformExtent(bbox, projection, this.projection),
          zoom: 10
        });

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

        const coords = copy(boundary.features[0].geometry.coordinates);
        const feature = new Feature(new Polygon(coords));
        feature.getGeometry().transform(projection, this.projection);
        const crop = new Crop({
          active: true,
          feature: feature,
          inner: false
        });
        // 👇 he's monkey-patched addFilter
        base['addFilter'](crop);

        const hillshade = new TileLayer({
          source: new XYZ({
            url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade/MapServer/tile/{z}/{y}/{x}'
          }),
          opacity: 0.33
        });

        const outline = new VectorLayer({
          source: new VectorSource({
            features: new GeoJSON().readFeatures(boundary, {
              featureProjection: this.projection
            })
          }),
          style: new Style({
            fill: new Fill({ color: [0, 0, 0, 0] }),
            stroke: new Stroke({ color: 'blue ' })
          })
        });

        const map = new Map({
          // view: view,
          // layers: [bg, base, hillshade, outline],
          target: this.host.nativeElement
        });

        map.setView(view);
        map.addLayer(bg);
        map.addLayer(base);
        map.addLayer(hillshade);
        map.addLayer(outline);

        const select = new Select({
          condition: pointerMove
        });
        map.addInteraction(select);
        select.on('select', console.log);

        this.geoJSON
          .loadByIndex(this.route, 'NEW HAMPSHIRE', 'towns')
          .subscribe((towns) => {
            const outline = new VectorLayer({
              source: new VectorSource({
                features: new GeoJSON().readFeatures(towns, {
                  featureProjection: this.projection
                })
              }),
              style: (): Style =>
                new Style({
                  fill: new Fill({ color: [0, 0, 0, 0] }),
                  stroke: new Stroke({ color: 'red ' })
                })
            });
            map.addLayer(outline);
          });
      });
  }
}
