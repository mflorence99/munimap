import { GeoJSONService } from '../services/geojson';
import { Mapable } from './ol-mapable';
import { MapableComponent } from './ol-mapable';
import { Parcel } from '../common';
import { Path } from '../state/view';
import { Searcher } from './ol-searcher';
import { SearcherComponent } from './ol-searcher';
import { Selector } from './ol-selector';
import { SelectorComponent } from './ol-selector';
import { ViewActions } from '../state/view';
import { ViewState } from '../state/view';
import { ViewStateModel } from '../state/view';

import { bboxSize } from '../common';

import { BehaviorSubject } from 'rxjs';
import { ChangeDetectionStrategy } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { Component } from '@angular/core';
import { Coordinate } from 'ol/coordinate';
import { ElementRef } from '@angular/core';
import { EventsKey as OLEventsKey } from 'ol/events';
import { HostListener } from '@angular/core';
import { OnDestroy } from '@angular/core';
import { OnInit } from '@angular/core';
import { OutputRefSubscription } from '@angular/core';
import { Store } from '@ngxs/store';
import { Subject } from 'rxjs';

import { centerOfMass } from '@turf/center-of-mass';
import { computed } from '@angular/core';
import { contentChild } from '@angular/core';
import { contentChildren } from '@angular/core';
import { effect } from '@angular/core';
import { fromLonLat } from 'ol/proj';
import { inject } from '@angular/core';
import { input } from '@angular/core';
import { model } from '@angular/core';
import { output } from '@angular/core';
import { signal } from '@angular/core';
import { squareGrid } from '@turf/square-grid';
import { toLonLat } from 'ol/proj';
import { transformExtent } from 'ol/proj';
import { unByKey } from 'ol/Observable';
import { viewChild } from '@angular/core';

import OLFeature from 'ol/Feature';
import OLMap from 'ol/Map';
import OLMapBrowserEvent from 'ol/MapBrowserEvent';
import OLView from 'ol/View';

const nominalDPI = 96;

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ol-map',
  template: `
    <section class="controls">
      <article class="panels">
        <ng-content select="[mapControlPanel]"></ng-content>
      </article>

      <article class="light-theme buttons">
        <ng-content select="[mapControlSearch]"></ng-content>
        <div class="filler"></div>
        <div class="lower">
          <ng-content select="[mapControlAccessibility]"></ng-content>
          <ng-content select="[mapControlZoom]"></ng-content>
          <ng-content select="[mapControlZoomToExtent]"></ng-content>
          <ng-content select="[mapControlExport]"></ng-content>
          <ng-content select="[mapControlPrint]"></ng-content>
          <ng-content select="[mapControlParcelList]"></ng-content>
          <ng-content select="[mapControlAttribution]"></ng-content>
        </div>
      </article>
    </section>

    <ng-content></ng-content>

    <canvas #canvas hidden></canvas>
  `,
  styles: [
    `
      :host {
        background: white;
        display: block;
        height: 100%;
        overflow: hidden;
        position: absolute;
        width: 100%;
      }

      .buttons {
        align-items: flex-end;
        color: var(--mat-gray-800);
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        grid-area: buttons;
        justify-content: flex-end;

        > * {
          flex-shrink: 0;
        }

        .lower {
          background-color: rgba(var(--rgb-gray-100), 0.67);
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          justify-content: flex-end;
          padding: 0.33rem 0;
        }
      }

      .controls {
        display: grid;
        grid-template-areas: 'panels . buttons';
        grid-template-columns: auto 1fr auto;
        grid-template-rows: 1fr;
        height: 100%;
        padding: 1rem;
        pointer-events: none;
        position: absolute;
        width: 100%;
        z-index: 1;

        > * {
          flex-shrink: 0;
        }
      }

      .filler {
        flex-grow: 1;
      }

      .panels {
        align-items: flex-start;
        display: flex;
        flex-direction: column;
        gap: 1rem;
        grid-area: panels;
        justify-content: flex-start;
      }
    `
  ],
  standalone: false
})
export class OLMapComponent implements OnDestroy, OnInit, Searcher, Selector {
  // 👉 proxy this from the real selector (if any) to ensure safe access
  abuttersFound = output<Parcel[]>();
  bbox = computed(
    () => this.bounds() ?? this.boundary()?.features?.[0]?.bbox ?? [0, 0, 0, 0]
  );
  boundary = signal<GeoJSON.FeatureCollection<any, any>>(null);
  boundaryExtent: Coordinate;
  boundaryGrid: GeoJSON.FeatureCollection<any, any>;
  bounds = input<Coordinate>();
  canvas = viewChild<ElementRef<HTMLCanvasElement>>('canvas');
  click$ = new Subject<OLMapBrowserEvent<any>>();
  contextMenu$ = new BehaviorSubject<PointerEvent>(null);
  contextMenuAt: number[];
  dpi = model(nominalDPI) /* 👈 nominal pixels per inch of screen */;
  escape$ = new Subject<KeyboardEvent>();
  featureProjection = 'EPSG:4326';
  // 👉 proxy this from the real selector (if any) to ensure safe access
  featuresSelected = output<OLFeature<any>[]>();
  fitToBounds = input(false);
  initialized = false;
  loadingStrategy = input<'all' | 'bbox'>();
  mapables = contentChildren<Mapable>(MapableComponent, { descendants: true });
  maxZoom = input(22);
  minUsefulZoom = input(15);
  minZoom = input(13);
  olMap: OLMap;
  olView: OLView;
  path = input<Path>();
  projection = 'EPSG:3857';
  searcher = contentChild<Searcher>(SearcherComponent);
  selector = contentChild<Selector>(SelectorComponent);
  vars: Record<string, string> = {};
  zoomChange = output<number>();

  #cdf = inject(ChangeDetectorRef);
  #changeKey: OLEventsKey;
  #clickKey: OLEventsKey;
  #geoJSON = inject(GeoJSONService);
  #host = inject(ElementRef);
  #printing = false;
  #store = inject(Store);
  #subToAbuttersFound: OutputRefSubscription;
  #subToFeaturesSelected: OutputRefSubscription;

  constructor() {
    this.olMap = new OLMap({
      controls: [],
      layers: null,
      maxTilesLoading: 256,
      moveTolerance: 1,
      target: null,
      view: null
    });
    this.olMap.setProperties({ component: this }, true);
    // 👉 get these up front, all at once,
    //    meaning we don't expect them to change
    this.vars = this.#findAllCustomVariables();
    // 👇 side effects
    effect(() => this.#initializeView(this.path()));
    effect(() => {
      this.#cleanMap();
      this.mapables().forEach((mapable) => mapable.addToMap());
      // 👉 proxy any selector events
      this.#subToAbuttersFound?.unsubscribe();
      this.#subToAbuttersFound = this.selector()?.abuttersFound?.subscribe(
        (abutters) => this.abuttersFound.emit(abutters)
      );
      this.#subToFeaturesSelected?.unsubscribe();
      this.#subToFeaturesSelected = this.selector()?.featuresSelected.subscribe(
        (features) => {
          this.featuresSelected.emit(features);
        }
      );
      // 👉 when there's no selector, there are no features selected
      if (!this.selector) {
        this.abuttersFound.emit([]);
        this.featuresSelected.emit([]);
      }
      // 👇 redraw on next tick
      setTimeout(
        () => this.mapables().forEach((mapable) => mapable.mapUpdated?.()),
        0
      );
    });
  }

  get orientation(): 'landscape' | 'portrait' {
    const [minX, minY, maxX, maxY] = this.bbox();
    const [cx, cy] = bboxSize(minX, minY, maxX, maxY);
    return cx > cy ? 'landscape' : 'portrait';
  }

  get printing(): boolean {
    return this.#printing;
  }

  // 👉 proxy this from the real selector (if any) to ensure safe access
  get roSelection(): boolean {
    return !!this.selector()?.roSelection;
  }

  // 👉 proxy this from the real selector (if any) to ensure safe access
  get selected(): OLFeature<any>[] {
    return this.selector()?.selected ?? [];
  }

  // 👉 proxy this from the real selector (if any) to ensure safe access
  get selectedIDs(): any[] {
    return this.selector()?.selectedIDs ?? [];
  }

  set printing(printing: boolean) {
    this.#printing = printing;
    this.#cdf.markForCheck();
  }

  @HostListener('contextmenu', ['$event']) onContextMenu(
    event: PointerEvent
  ): void {
    event.preventDefault();
    this.contextMenuAt = this.coordinateFromEvent(event.clientX, event.clientY);
    console.log(toLonLat(this.contextMenuAt));
    this.contextMenu$.next(event);
  }

  @HostListener('document:keydown.escape', ['$event']) onEscape(
    event: KeyboardEvent
  ): void {
    this.escape$.next(event);
    event.stopPropagation();
  }

  coordinateFromEvent(x: number, y: number): Coordinate {
    // 👉 need to hack Y offsets by the height of the toolbar
    const style = getComputedStyle(document.documentElement);
    const hack = Number(style.getPropertyValue('--map-cy-toolbar'));
    return this.olMap.getCoordinateFromPixel([x, y - hack]);
  }

  currentCounty(): string {
    return this.path()?.split(':')[1];
  }

  currentState(): string {
    return this.path()?.split(':')[0];
  }

  currentTown(): string {
    return this.path()?.split(':')[2];
  }

  measureText(text: string, font: string): TextMetrics {
    const ctx = this.canvas().nativeElement.getContext('2d');
    ctx.font = font;
    return ctx.measureText(text);
  }

  ngOnDestroy(): void {
    if (this.#changeKey) unByKey(this.#changeKey);
    if (this.#clickKey) unByKey(this.#clickKey);
  }

  ngOnInit(): void {
    this.#clickKey = this.olMap.on('click', this.#onClick.bind(this));
    this.olMap.setTarget(this.#host.nativeElement);
  }

  numPixels(nominal: number): number {
    return (this.dpi() / nominalDPI) * nominal;
  }

  zoomToBounds(): void {
    this.olView.fit(this.boundaryExtent, { size: this.olMap.getSize() });
    this.#onChange();
  }

  #cleanMap(): void {
    // 👇 we only want to remove the controls we added
    const controls = [...this.olMap.getControls().getArray()];
    controls.forEach((control) => {
      if (control.get('component')) this.olMap.removeControl(control);
    });
    // 👇 we only want to remove the interactions we added
    //    OL adds a bunch of its own we must keep intact
    const interactions = [...this.olMap.getInteractions().getArray()];
    interactions.forEach((interaction) => {
      if (interaction.get('component'))
        this.olMap.removeInteraction(interaction);
    });
    // 👇 we only want to remove the layers we added
    const layers = [...this.olMap.getLayers().getArray()];
    layers.forEach((layer) => {
      if (layer.get('component')) this.olMap.removeLayer(layer);
    });
  }

  #createView(boundary: GeoJSON.FeatureCollection<any, any>): void {
    // 👉 precompute boundary extent
    this.boundary.set(boundary);
    this.boundaryExtent = transformExtent(
      this.bbox(),
      this.featureProjection,
      this.projection
    );
    // 👉 precompute boundary grid, but only if needed
    //    we need to make sure that the bounding box is an even
    //    multiple of the cell size for complete grid coverage
    if (this.loadingStrategy() === 'bbox') {
      const [minX, minY, maxX, maxY] = this.bbox();
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
      maxZoom: this.maxZoom(),
      minZoom: this.minZoom(),
      smoothExtentConstraint: true,
      showFullExtent: true
    });
    this.olView.setProperties({ component: this }, true);
    this.olMap.setView(this.olView);
    // 👉 if center, zoom available use them else fit to bounds
    const viewState = this.#store.selectSnapshot<ViewStateModel>(ViewState.view)
      .viewByPath[this.path()];
    if (this.fitToBounds()) this.zoomToBounds();
    else if (viewState?.center && viewState?.zoom) {
      this.olView.setCenter(fromLonLat(viewState.center));
      this.olView.setZoom(viewState.zoom);
    } else {
      const center = centerOfMass(this.boundary()).geometry.coordinates;
      this.olView.setCenter(fromLonLat(center));
      this.olView.setZoom(this.minUsefulZoom());
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
        } catch (e) {
          console.error(e.getMessage());
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

  #initializeView(path: Path): void {
    // 👉 clean out the old map
    this.initialized = false;
    this.#cleanMap();
    // 👉 now create the new
    // 🔥 this seems like a hack
    //    we know we use Font Awesome to show map icons and
    //    it must be loaded before we proceed
    document.fonts.load(`normal bold 10px 'Font Awesome'`).then(() => {
      this.#geoJSON
        .loadByIndex(path, 'boundary')
        .subscribe((boundary: GeoJSON.FeatureCollection<any, any>) => {
          this.#createView(boundary);
          this.initialized = true;
          this.#onChange();
          this.#cdf.markForCheck();
        });
    });
  }

  #onChange(): void {
    const center = toLonLat(this.olView.getCenter());
    const zoom = this.olView.getZoom();
    this.zoomChange.emit(zoom);
    if (!this.fitToBounds())
      this.#store.dispatch(
        new ViewActions.UpdateView(this.path(), { center, zoom })
      );
  }

  #onClick(event: OLMapBrowserEvent<any>): void {
    this.click$.next(event);
  }
}
