import { LegendComponent } from './home/legend';
import { RootPage } from './home/root';
import { SetupComponent } from './home/setup';
import { TownMapPage } from './home/town-map';

import * as Sentry from '@sentry/angular';

import { AngularFireAuthModule } from '@angular/fire/auth';
import { AngularFireModule } from '@angular/fire';
import { AnonState } from '@lib/state/anon';
import { APP_INITIALIZER } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BrowserModule } from '@angular/platform-browser';
import { ColorPickerModule } from 'ngx-color-picker';
import { CommonModule } from '@angular/common';
import { ConfirmDialogComponent } from '@lib/components/confirm-dialog';
import { CurrencyPipe } from '@angular/common';
import { DecimalPipe } from '@angular/common';
import { ErrorHandler } from '@angular/core';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FormsModule } from '@angular/forms';
import { GeoJSONService } from '@lib/services/geojson';
import { GeoJSONViewerService } from '@lib/services/geojson-viewer';
import { GeolocationService } from '@lib/services/geolocation';
import { GeosimulatorService } from '@lib/services/geosimulator';
import { HttpClientModule } from '@angular/common/http';
import { IndexResolver } from '@lib/resolvers/index';
import { InitializerService } from '@lib/services/initializer';
import { LocationStrategy } from '@angular/common';
import { MapState } from '@lib/state/map';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MessageDialogComponent } from '@lib/components/message-dialog';
import { NgModule } from '@angular/core';
import { NgxsLoggerPluginModule } from '@ngxs/logger-plugin';
import { NgxsModule } from '@ngxs/store';
import { NgxsReduxDevtoolsPluginModule } from '@ngxs/devtools-plugin';
import { NgxsStoragePluginModule } from '@ngxs/storage-plugin';
import { OLAttributionComponent } from '@lib/ol/ol-attribution';
import { OLControlAttributionComponent } from '@lib/ol/ol-control-attribution';
import { OLControlGraticuleComponent } from '@lib/ol/ol-control-graticule';
import { OLControlPlusMinusComponent } from '@lib/ol/ol-control-plusminus';
import { OLControlScaleLineComponent } from '@lib/ol/ol-control-scaleline';
import { OLControlSearchParcelsComponent } from '@lib/ol/ol-control-searchparcels';
import { OLControlZoomToExtentComponent } from '@lib/ol/ol-control-zoom2extent';
import { OLFilterCrop2BoundaryComponent } from '@lib/ol/ol-filter-crop2boundary';
import { OLFilterCrop2SelectedComponent } from '@lib/ol/ol-filter-crop2selected';
import { OLFilterPencilComponent } from '@lib/ol/ol-filter-pencil';
import { OLInteractionSelectComponent } from '@lib/ol/ol-interaction-select';
import { OLLayerMapboxComponent } from '@lib/ol/ol-layer-mapbox';
import { OLLayerTileComponent } from '@lib/ol/ol-layer-tile';
import { OLLayerVectorComponent } from '@lib/ol/ol-layer-vector';
import { OLLayerVectorTileComponent } from '@lib/ol/ol-layer-vectortile';
import { OLMapComponent } from '@lib/ol/ol-map';
import { OLOverlayGPSComponent } from '@lib/ol/ol-overlay-gps';
import { OLPopupParcelPropertiesComponent } from '@lib/ol/ol-popup-parcelproperties';
import { OLPopupSelectionComponent } from '@lib/ol/ol-popup-selection';
import { OLSourceBoundaryComponent } from '@lib/ol/ol-source-boundary';
import { OLSourceFloodplainComponent } from '@lib/ol/ol-source-floodplain';
import { OLSourceGeoJSONComponent } from '@lib/ol/ol-source-geojson';
import { OLSourceOSMComponent } from '@lib/ol/ol-source-osm';
import { OLSourceParcelsComponent } from '@lib/ol/ol-source-parcels';
import { OLSourcePeatlandComponent } from '@lib/ol/ol-source-peatland';
import { OLSourceStoneWallsComponent } from '@lib/ol/ol-source-stonewalls';
import { OLSourceWetlandComponent } from '@lib/ol/ol-source-wetland';
import { OLSourceXYZComponent } from '@lib/ol/ol-source-xyz';
import { OLStyleBoundaryComponent } from '@lib/ol/ol-style-boundary';
import { OLStyleBuildingsComponent } from '@lib/ol/ol-style-buildings';
import { OLStyleFloodplainComponent } from '@lib/ol/ol-style-floodplain';
import { OLStyleGraticuleComponent } from '@lib/ol/ol-style-graticule';
import { OLStyleLakesComponent } from '@lib/ol/ol-style-lakes';
import { OLStyleParcelsComponent } from '@lib/ol/ol-style-parcels';
import { OLStylePatternDirective } from '@lib/ol/ol-style-pattern';
import { OLStylePeatlandComponent } from '@lib/ol/ol-style-peatland';
import { OLStylePlacesComponent } from '@lib/ol/ol-style-places';
import { OLStylePolygonsComponent } from '@lib/ol/ol-style-polygons';
import { OLStylePowerlinesComponent } from '@lib/ol/ol-style-powerlines';
import { OLStyleRiversComponent } from '@lib/ol/ol-style-rivers';
import { OLStyleRoadsComponent } from '@lib/ol/ol-style-roads';
import { OLStyleStoneWallsComponent } from '@lib/ol/ol-style-stonewalls';
import { OLStyleTrailsComponent } from '@lib/ol/ol-style-trails';
import { OLStyleWetlandComponent } from '@lib/ol/ol-style-wetland';
import { OverlayState } from '@lib/state/overlay';
import { ParcelsState } from '@lib/state/parcels';
import { PathLocationStrategy } from '@angular/common';
import { ReadyResolver } from '@lib/resolvers/ready';
import { RouterModule } from '@angular/router';
import { ServiceWorkerModule } from '@angular/service-worker';
import { USE_EMULATOR as USE_AUTH_EMULATOR } from '@angular/fire/auth';
import { USE_EMULATOR as USE_FIRESTORE_EMULATOR } from '@angular/fire/firestore';
import { VersionDialogComponent } from '@lib/components/version-dialog';
import { ViewState } from '@lib/state/view';

import { environment } from '@lib/environment';
import { faBars } from '@fortawesome/pro-solid-svg-icons';
import { faClipboard } from '@fortawesome/pro-regular-svg-icons';
import { faCog } from '@fortawesome/pro-solid-svg-icons';
import { faExpandArrows } from '@fortawesome/pro-solid-svg-icons';
import { faGlobeAmericas } from '@fortawesome/pro-duotone-svg-icons';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { faMap } from '@fortawesome/pro-duotone-svg-icons';
import { faMapMarkerAlt } from '@fortawesome/pro-duotone-svg-icons';
import { faMinus } from '@fortawesome/pro-light-svg-icons';
import { faPalette } from '@fortawesome/pro-duotone-svg-icons';
import { faPlus } from '@fortawesome/pro-light-svg-icons';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import { faSync } from '@fortawesome/free-solid-svg-icons';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { initializeAppProvider } from '@lib/services/initializer';

const COMPONENTS = [
  ConfirmDialogComponent,
  LegendComponent,
  MessageDialogComponent,
  OLAttributionComponent,
  OLControlAttributionComponent,
  OLControlGraticuleComponent,
  OLControlPlusMinusComponent,
  OLControlScaleLineComponent,
  OLControlSearchParcelsComponent,
  OLControlZoomToExtentComponent,
  OLFilterCrop2BoundaryComponent,
  OLFilterCrop2SelectedComponent,
  OLFilterPencilComponent,
  OLInteractionSelectComponent,
  OLLayerMapboxComponent,
  OLLayerTileComponent,
  OLLayerVectorComponent,
  OLLayerVectorTileComponent,
  OLMapComponent,
  OLOverlayGPSComponent,
  OLPopupParcelPropertiesComponent,
  OLPopupSelectionComponent,
  OLSourceBoundaryComponent,
  OLSourceFloodplainComponent,
  OLSourceGeoJSONComponent,
  OLSourceOSMComponent,
  OLSourceParcelsComponent,
  OLSourcePeatlandComponent,
  OLSourceStoneWallsComponent,
  OLSourceWetlandComponent,
  OLSourceXYZComponent,
  OLStyleBoundaryComponent,
  OLStyleBuildingsComponent,
  OLStyleFloodplainComponent,
  OLStyleGraticuleComponent,
  OLStyleLakesComponent,
  OLStyleParcelsComponent,
  OLStylePatternDirective,
  OLStylePlacesComponent,
  OLStylePeatlandComponent,
  OLStylePolygonsComponent,
  OLStylePowerlinesComponent,
  OLStyleRiversComponent,
  OLStyleRoadsComponent,
  OLStyleStoneWallsComponent,
  OLStyleTrailsComponent,
  OLStyleWetlandComponent,
  SetupComponent,
  VersionDialogComponent
];

const DIRECTIVES = [];

const PAGES = [RootPage, TownMapPage];

const ROUTES = [
  {
    path: 'town-map',
    component: TownMapPage,
    resolve: {
      index: IndexResolver,
      ready: ReadyResolver
    }
  }
];

const STATES = [AnonState, MapState, OverlayState, ParcelsState, ViewState];
const STATES_SAVED = [OverlayState, ViewState];

@NgModule({
  bootstrap: [RootPage],

  declarations: [...COMPONENTS, ...DIRECTIVES, ...PAGES],

  entryComponents: [],

  imports: [
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireAuthModule,
    BrowserAnimationsModule,
    BrowserModule,
    ColorPickerModule,
    CommonModule,
    FontAwesomeModule,
    FormsModule,
    HttpClientModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatCheckboxModule,
    MatDialogModule,
    MatMenuModule,
    MatSidenavModule,
    MatSnackBarModule,
    MatToolbarModule,
    MatTooltipModule,
    NgxsModule.forRoot(STATES, {
      developmentMode: !environment.production
    }),
    NgxsLoggerPluginModule.forRoot({ collapsed: false }),
    NgxsReduxDevtoolsPluginModule.forRoot({
      disabled: environment.production
    }),
    NgxsStoragePluginModule.forRoot({ key: STATES_SAVED }),
    RouterModule.forRoot(ROUTES, { onSameUrlNavigation: 'reload' }),
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: environment.production,
      registrationStrategy: 'registerImmediately'
    })
  ],

  providers: [
    CurrencyPipe,
    DecimalPipe,
    {
      provide: APP_INITIALIZER,
      useFactory: initializeAppProvider,
      deps: [InitializerService],
      multi: true
    },
    {
      provide: ErrorHandler,
      useValue: Sentry.createErrorHandler({
        logErrors: true,
        showDialog: false
      })
    },
    { provide: GeoJSONService, useClass: GeoJSONViewerService },
    {
      provide: GeolocationService,
      useClass: environment.production
        ? GeolocationService
        : GeosimulatorService
    },
    { provide: LocationStrategy, useClass: PathLocationStrategy },
    {
      provide: USE_AUTH_EMULATOR,
      useValue: !environment.production ? ['localhost', 9099] : null
    },
    {
      provide: USE_FIRESTORE_EMULATOR,
      useValue: !environment.production ? ['localhost', 8080] : null
    }
  ]
})
export class RootModule {
  constructor(library: FaIconLibrary) {
    // 👇 must add icons we use right here
    library.addIcons(
      faBars,
      faClipboard,
      faCog,
      faExpandArrows,
      faGlobeAmericas,
      faInfoCircle,
      faMap,
      faMapMarkerAlt,
      faMinus,
      faPalette,
      faPlus,
      faSearch,
      faSync,
      faTimes
    );
  }
}
