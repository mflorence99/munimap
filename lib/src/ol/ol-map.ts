import { GeoJSONService } from '../services/geojson';
import { MapableComponent } from './ol-mapable';
import { Parcel } from '../common';
import { Path } from '../state/view';
import { Searcher } from './ol-searcher';
import { SearcherComponent } from './ol-searcher';
import { Selector } from './ol-selector';
import { SelectorComponent } from './ol-selector';
import { UpdateView } from '../state/view';
import { ViewState } from '../state/view';

import { ActivatedRoute } from '@angular/router';
import { AfterContentInit } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ChangeDetectionStrategy } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { Component } from '@angular/core';
import { ContentChild } from '@angular/core';
import { ContentChildren } from '@angular/core';
import { Coordinate } from 'ol/coordinate';
import { ElementRef } from '@angular/core';
import { EventEmitter } from '@angular/core';
import { EventsKey as OLEventsKey } from 'ol/events';
import { HostListener } from '@angular/core';
import { Input } from '@angular/core';
import { OnDestroy } from '@angular/core';
import { OnInit } from '@angular/core';
import { Output } from '@angular/core';
import { QueryList } from '@angular/core';
import { Store } from '@ngxs/store';
import { Subject } from 'rxjs';
import { Subscription } from 'rxjs';
import { ViewChild } from '@angular/core';

import { fromLonLat } from 'ol/proj';
import { toLonLat } from 'ol/proj';
import { transformExtent } from 'ol/proj';
import { unByKey } from 'ol/Observable';

import centerOfMass from '@turf/center-of-mass';
import OLFeature from 'ol/Feature';
import OLMap from 'ol/Map';
import OLMapBrowserEvent from 'ol/MapBrowserEvent';
import OLView from 'ol/View';
import squareGrid from '@turf/square-grid';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-map',
  templateUrl: './ol-map.html',
  styleUrls: ['./ol-map.scss']
})
export class OLMapComponent
  implements AfterContentInit, OnDestroy, OnInit, Searcher, Selector
{
  #bbox: Coordinate;
  #changeKey: OLEventsKey;
  #clickKey: OLEventsKey;
  #origControls: string[];
  #origInteractions: string[];
  #origLayers: string[];
  #path: Path;
  #subToAbuttersFound: Subscription;
  #subToFeaturesSelected: Subscription;

  // 👉 proxy this from the real selector (if any) to ensure safe access
  abuttersFound = new EventEmitter<Parcel[]>();

  @Input() // 👈 optionally circumscibes map
  get bbox(): Coordinate {
    return this.#bbox ?? this.boundary.features[0].bbox;
  }
  set bbox(bbox: Coordinate) {
    this.#bbox = bbox;
  }

  boundary: GeoJSON.FeatureCollection<any, any>;
  boundaryExtent: Coordinate;
  boundaryGrid: GeoJSON.FeatureCollection<any, any>;

  @ViewChild('canvas') canvas: ElementRef<HTMLCanvasElement>;

  click$ = new Subject<OLMapBrowserEvent<any>>();
  contextMenu$ = new BehaviorSubject<PointerEvent>(null);
  escape$ = new Subject<KeyboardEvent>();

  featureProjection = 'EPSG:4326';

  // 👉 proxy this from the real selector (if any) to ensure safe access
  featuresSelected = new EventEmitter<OLFeature<any>[]>();

  @Input() fitToBounds = false;

  initialized = false;

  @Input() loadingStrategy: 'all' | 'bbox';

  @ContentChildren(MapableComponent, { descendants: true })
  mapables$: QueryList<any>;

  @Input() maxZoom;
  @Input() minUsefulZoom = 15;
  @Input() minZoom;

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

  @ContentChild(SearcherComponent) searcher: Searcher;

  // 👉 proxy this from the real selector (if any) to ensure safe access
  get selected(): OLFeature<any>[] {
    return this.selector?.selected ?? [];
  }

  // 👉 proxy this from the real selector (if any) to ensure safe access
  get selectedIDs(): any[] {
    return this.selector?.selectedIDs ?? [];
  }

  @ContentChild(SelectorComponent) selector: Selector;

  vars: Record<string, string> = {};

  @Output() zoomChange = new EventEmitter<number>();

  constructor(
    public cdf: ChangeDetectorRef,
    private geoJSON: GeoJSONService,
    private host: ElementRef,
    private route: ActivatedRoute,
    private store: Store
  ) {
    this.olMap = new OLMap({
      controls: [],
      layers: null,
      maxTilesLoading: 256,
      moveTolerance: 1,
      target: null,
      view: null
    });
    // 👉 capture the original contents of the map
    this.#origControls = this.olMap
      .getControls()
      .getArray()
      .map((control) => control.constructor.name);
    this.#origInteractions = this.olMap
      .getInteractions()
      .getArray()
      .map((interaction) => interaction.constructor.name);
    this.#origLayers = this.olMap
      .getLayers()
      .getArray()
      .map((layer) => layer.constructor.name);
    // 👉 get these up front, all at once,
    //    meaning we don't expect them to change
    this.vars = this.#findAllCustomVariables();
  }

  // 👇 https://stackoverflow.com/questions/40862706
  #cleanMap(): void {
    const controls = [...this.olMap.getControls().getArray()];
    controls.forEach((control) => {
      // 👇 this should never happen, as there are no default controls
      if (!this.#origControls.includes(control.constructor.name))
        this.olMap.removeControl(control);
    });
    const interactions = [...this.olMap.getInteractions().getArray()];
    interactions.forEach((interaction) => {
      // 👇 OL adds a bunch of interactions of its own
      //    that we don't want to remove
      if (!this.#origInteractions.includes(interaction.constructor.name))
        this.olMap.removeInteraction(interaction);
    });
    const layers = [...this.olMap.getLayers().getArray()];
    layers.forEach((layer) => {
      // 👇 this should never happen, as there are no default layers
      if (!this.#origLayers.includes(layer.constructor.name))
        this.olMap.removeLayer(layer);
    });
  }

  #createView(boundary: GeoJSON.FeatureCollection<any, any>): void {
    // 👉 precompute boundary extent
    this.boundary = boundary;
    this.boundaryExtent = transformExtent(
      this.bbox,
      this.featureProjection,
      this.projection
    );
    // 👉 precompute boundary grid, but only if needed
    //    we need to make sure that the bounding box is an even
    //    multiple of the cell size for complete grid coverage
    if (this.loadingStrategy === 'bbox') {
      const [minX, minY, maxX, maxY] = this.bbox;
      const floored: GeoJSON.BBox = [
        Math.floor(minX * 10) / 10,
        Math.floor(minY * 10) / 10,
        Math.ceil(maxX * 10) / 10,
        Math.ceil(maxY * 10) / 10
      ];
      this.boundaryGrid = squareGrid(floored, 0.02, {
        units: 'degrees',
        mask: boundary.features[0]
      });
    }
    // 👉 create view
    this.olView = new OLView({
      extent: this.boundaryExtent,
      maxZoom: this.maxZoom,
      minZoom: this.minZoom,
      smoothExtentConstraint: true,
      showFullExtent: true
    });
    this.olMap.setView(this.olView);
    // 👉 if center, zoom available use them else fit to bounds
    const viewState =
      this.store.selectSnapshot(ViewState).viewByPath[this.path];
    if (this.fitToBounds) this.zoomToBounds();
    else if (viewState?.center && viewState?.zoom) {
      this.olView.setCenter(fromLonLat(viewState.center));
      this.olView.setZoom(viewState.zoom);
    } else {
      const center = centerOfMass(this.boundary).geometry.coordinates;
      this.olView.setCenter(fromLonLat(center));
      this.olView.setZoom(this.minUsefulZoom);
    }
    // 👉 handle events
    this.#changeKey = this.olView.on('change', this.#onChange.bind(this));
  }

  #findAllCustomVariables(): Record<string, string> {
    // 👉 https://stackoverflow.com/questions/48760274
    const names = Array.from(document.styleSheets)
      .filter(
        (sheet) => sheet.href == null || sheet.href.startsWith(location.origin)
      )
      // 🐛 Failed to read the 'cssRules' property from 'CSSStyleSheet': Cannot access rules
      .filter((sheet) => {
        try {
          return !!sheet.cssRules;
        } catch (ignored) {
          return false;
        }
      })
      .reduce(
        (acc, sheet) =>
          (acc = [
            ...acc,
            ...Array.from(sheet.cssRules).reduce(
              (def, rule: any) =>
                (def =
                  rule.selectorText === ':root'
                    ? [...def, ...Array.from(rule.style)]
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
      // 👉 proxy any selector events
      this.#subToAbuttersFound?.unsubscribe();
      this.#subToAbuttersFound = this.selector?.abuttersFound.subscribe(
        (abutters) => this.abuttersFound.emit(abutters)
      );
      this.#subToFeaturesSelected?.unsubscribe();
      this.#subToFeaturesSelected = this.selector?.featuresSelected.subscribe(
        (features) => {
          this.featuresSelected.emit(features);
        }
      );
      // 👉 when there's no selector, there are no features selected
      if (!this.selector) {
        this.abuttersFound.emit([]);
        this.featuresSelected.emit([]);
      }
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
      // 🔥 this seems like a hack
      //    we know we use Font Awesome to show map icons and
      //    it must be loaded before we proceed
      document.fonts.load(`normal bold 10px 'Font Awesome`).then(() => {
        this.geoJSON
          .loadByIndex(this.route, path, 'boundary')
          .subscribe((boundary: GeoJSON.FeatureCollection<any, any>) => {
            this.#createView(boundary);
            this.initialized = true;
            this.#onChange();
            this.cdf.markForCheck();
          });
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
    return this.path?.split(':')[1];
  }

  currentState(): string {
    return this.path?.split(':')[0];
  }

  currentTown(): string {
    return this.path?.split(':')[2];
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
    if (this.#changeKey) unByKey(this.#changeKey);
    if (this.#clickKey) unByKey(this.#clickKey);
  }

  ngOnInit(): void {
    this.#clickKey = this.olMap.on('click', this.#onClick.bind(this));
    this.olMap.setTarget(this.host.nativeElement);
  }

  @HostListener('contextmenu', ['$event']) onContextMenu(
    event: PointerEvent
  ): void {
    event.preventDefault();
    this.contextMenu$.next(event);
  }

  @HostListener('document:keydown.escape', ['$event']) onEscape(
    event: KeyboardEvent
  ): void {
    this.escape$.next(event);
  }

  zoomToBounds(): void {
    this.olView.fit(this.boundaryExtent, { size: this.olMap.getSize() });
    this.#onChange();
  }
}
