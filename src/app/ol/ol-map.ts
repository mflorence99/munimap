import { GeoJSONService } from '../services/geojson';
import { MapableComponent } from './ol-mapable';
import { OLInteractionRedrawComponent } from './ol-interaction-redraw';
import { OLInteractionSelectComponent } from './ol-interaction-select';
import { Path } from '../state/view';
import { UpdateView } from '../state/view';
import { ViewState } from '../state/view';

import { ActivatedRoute } from '@angular/router';
import { AfterContentInit } from '@angular/core';
import { ChangeDetectionStrategy } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { Component } from '@angular/core';
import { ContentChildren } from '@angular/core';
import { Coordinate } from 'ol/coordinate';
import { ElementRef } from '@angular/core';
import { EventEmitter } from '@angular/core';
import { HostListener } from '@angular/core';
import { Input } from '@angular/core';
import { OnDestroy } from '@angular/core';
import { OnInit } from '@angular/core';
import { Output } from '@angular/core';
import { QueryList } from '@angular/core';
import { Store } from '@ngxs/store';
import { Subject } from 'rxjs';
import { ViewChild } from '@angular/core';

import { fromLonLat } from 'ol/proj';
import { getDistance } from 'ol/sphere';
import { saveAs } from 'file-saver';
import { toLonLat } from 'ol/proj';
import { transformExtent } from 'ol/proj';

import html2canvas from 'html2canvas';
import OLMap from 'ol/Map';
import OLMapBrowserEvent from 'ol/MapBrowserEvent';
import OLView from 'ol/View';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-map',
  templateUrl: './ol-map.html',
  styleUrls: ['./ol-map.scss']
})
export class OLMapComponent implements AfterContentInit, OnDestroy, OnInit {
  #path: Path;

  boundary: GeoJSON.FeatureCollection<GeoJSON.Polygon>;
  boundaryExtent: Coordinate;

  @ViewChild('canvas') canvas: ElementRef<HTMLCanvasElement>;

  click$ = new Subject<OLMapBrowserEvent<any>>();
  contextMenu$ = new Subject<PointerEvent>();

  featureProjection = 'EPSG:4326';

  @Input() fitToBounds = false;

  initialized = false;

  @ContentChildren(MapableComponent, { descendants: true })
  mapables$: QueryList<any>;

  @Input() maxZoom = 18;
  @Input() minZoom = 8;

  olMap: OLMap;
  olView: OLView;

  @Input()
  get path(): Path {
    return this.#path;
  }
  set path(path: Path) {
    this.#path = this.#initializeView(path);
  }

  printing = false;

  projection = 'EPSG:3857';
  redrawer: OLInteractionRedrawComponent;
  selector: OLInteractionSelectComponent;
  vars: Record<string, string> = {};

  @Output() zoomChange = new EventEmitter<number>();

  constructor(
    private cdf: ChangeDetectorRef,
    private geoJSON: GeoJSONService,
    private host: ElementRef,
    private route: ActivatedRoute,
    private store: Store
  ) {
    this.olMap = new OLMap({
      controls: [],
      layers: null,
      maxTilesLoading: 128,
      moveTolerance: 8,
      target: null,
      view: null
    });
    // 👉 get these up front, all at once,
    //    meaning we don't expect them to change
    this.vars = this.#findAllCustomVariables();
  }

  // 👇 https://stackoverflow.com/questions/40862706
  #cleanMap(): void {
    const controls = [...this.olMap.getControls().getArray()];
    controls.forEach((control) => this.olMap.removeControl(control));
    const interactions = [...this.olMap.getInteractions().getArray()];
    interactions.forEach((interaction) => {
      // 👉 OL adds a bunch of interactions of its own
      //    that we don't want to remove
      if (interaction['addToMap']) this.olMap.removeInteraction(interaction);
    });
    const layers = [...this.olMap.getLayers().getArray()];
    layers.forEach((layer) => this.olMap.removeLayer(layer));
  }

  #createView(boundary: GeoJSON.FeatureCollection<GeoJSON.Polygon>): void {
    this.olView = new OLView({ maxZoom: this.maxZoom, minZoom: this.minZoom });
    this.olMap.setView(this.olView);
    // 👉 precompute boundary extent
    this.boundary = boundary;
    const bbox = boundary.features[0].bbox;
    this.boundaryExtent = transformExtent(
      bbox,
      this.featureProjection,
      this.projection
    );
    // 👉 if center, zoom available use them else fit to bounds
    const view = this.store.selectSnapshot(ViewState).viewByPath[this.path];
    if (!this.fitToBounds && view?.center && view?.zoom) {
      this.olView.setCenter(fromLonLat(view.center));
      this.olView.setZoom(view.zoom);
    } else this.zoomToBounds();
    // 👉 handle events
    this.olView.on('change', this.#onChange.bind(this));
  }

  #findAllCustomVariables(): Record<string, string> {
    // 👉 https://stackoverflow.com/questions/48760274
    const names = Array.from(document.styleSheets)
      .filter(
        (sheet) =>
          sheet.href === null || sheet.href.startsWith(window.location.origin)
      )
      .reduce(
        (acc, sheet) =>
          (acc = [
            ...acc,
            ...Array.from(sheet.cssRules).reduce(
              (def, rule: any) =>
                (def =
                  rule.selectorText === ':root'
                    ? [
                        ...def,
                        ...Array.from(rule.style).filter((name: any) =>
                          name.startsWith('--map')
                        )
                      ]
                    : def),
              []
            )
          ]),
        []
      );
    const style = getComputedStyle(document.documentElement);
    // 👉 now organize them as { name: value }
    return names.reduce((acc, name) => {
      acc[name] = style.getPropertyValue(name).trim();
      return acc;
    }, {});
  }

  #handleMapables$(): void {
    this.mapables$.changes.subscribe((list) => {
      this.#cleanMap();
      list.forEach((mapable) => mapable.addToMap());
    });
  }

  #initializeView(path: Path): Path {
    // 👉 if the path has changed, clean out the old map
    if (path !== this.#path) {
      this.initialized = false;
      this.#cleanMap();
      this.olView = null;
    }
    // 👉 now create the new
    if (!this.olView) {
      this.geoJSON
        .loadByIndex(this.route, path, 'boundary')
        .subscribe((boundary: GeoJSON.FeatureCollection<GeoJSON.Polygon>) => {
          this.#createView(boundary);
          this.initialized = true;
          this.#onChange();
          this.cdf.markForCheck();
        });
    }
    return path;
  }

  #onChange(): void {
    const center = toLonLat(this.olView.getCenter());
    const zoom = this.olView.getZoom();
    this.zoomChange.emit(zoom);
    if (!this.fitToBounds)
      this.store.dispatch(new UpdateView(this.path, { center, zoom }));
  }

  #onClick(event: OLMapBrowserEvent<any>): void {
    this.click$.next(event);
  }

  currentCounty(): string {
    return this.path.split(':')[1];
  }

  currentState(): string {
    return this.path.split(':')[0];
  }

  currentTown(): string {
    return this.path.split(':')[2];
  }

  measureText(text: string, font: string): TextMetrics {
    const ctx = this.canvas.nativeElement.getContext('2d');
    ctx.font = font;
    return ctx.measureText(text);
  }

  ngAfterContentInit(): void {
    this.#handleMapables$();
  }

  ngOnDestroy(): void {
    this.olMap?.un('click', this.#onClick.bind(this));
    this.olView?.un('change', this.#onChange.bind(this));
  }

  ngOnInit(): void {
    this.olMap.on('click', this.#onClick.bind(this));
    this.olMap.setTarget(this.host.nativeElement);
  }

  @HostListener('contextmenu', ['$event']) onContextMenu(
    event: PointerEvent
  ): void {
    event.preventDefault();
    this.contextMenu$.next(event);
  }

  // 🔥 all temporary

  print(): void {
    const zoom = this.olView.getZoom();
    this.olView.setZoom(13);

    const [minX, minY, maxX, maxY] = this.boundary.features[0].bbox;
    const resolution = this.olView.getResolution();
    const px = getDistance([minX, maxY], [maxX, minY]) / resolution;
    const py = getDistance([minX, minY], [minX, maxY]) / resolution;

    this.olMap.once('rendercomplete', () => {
      html2canvas(this.olMap.getViewport(), {
        height: py,
        useCORS: true,
        width: px
      }).then((canvas) => {
        canvas.toBlob((blob) => {
          saveAs(blob, 'xxx.png');

          const element = this.olMap.getTargetElement();
          element.style.height = ``;
          element.style.overflow = 'hidden';
          element.style.width = ``;
          this.olMap.updateSize();
          this.olView.setZoom(zoom);
          this.printing = false;
          this.cdf.markForCheck();
        });
      });
    });

    const element = this.olMap.getTargetElement();
    element.style.height = `${py}px`;
    element.style.overflow = 'visible';
    element.style.width = `${px}px`;
    this.olMap.updateSize();
    this.zoomToBounds();
    this.printing = true;
  }

  zoomToBounds(): void {
    this.olView.fit(this.boundaryExtent, { size: this.olMap.getSize() });
    this.#onChange();
  }
}
