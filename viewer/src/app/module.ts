import { ParcelsLegendComponent } from './pages/parcels/legend';
import { ParcelsOverlayComponent } from './pages/parcels/overlay';
import { ParcelsPage } from './pages/parcels/page';
import { PropertyLegendComponent } from './pages/property/legend';
import { PropertyPage } from './pages/property/page';
import { RootPage } from './pages/root/page';
import { StreetsLegendComponent } from './pages/streets/legend';
import { StreetsPage } from './pages/streets/page';
import { TopoLegendComponent } from './pages/topo/legend';
import { TopoPage } from './pages/topo/page';

import * as Sentry from '@sentry/angular';

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
import { LandmarksState } from '@lib/state/landmarks';
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
import { OLAdaptorBoundaryComponent } from '@lib/ol/ol-adaptor-boundary';
import { OLAdaptorBridgesComponent } from '@lib/ol/ol-adaptor-bridges';
import { OLAdaptorBuildingsComponent } from '@lib/ol/ol-adaptor-buildings';
import { OLAdaptorConservationsComponent } from '@lib/ol/ol-adaptor-conservations';
import { OLAdaptorFloodplainsComponent } from '@lib/ol/ol-adaptor-floodplains';
import { OLAdaptorGeoJSONComponent } from '@lib/ol/ol-adaptor-geojson';
import { OLAdaptorRailroadsComponent } from '@lib/ol/ol-adaptor-railroads';
import { OLAdaptorTrailsComponent } from '@lib/ol/ol-adaptor-trails';
import { OLAttributionComponent } from '@lib/ol/ol-attribution';
import { OLControlAttributionComponent } from '@lib/ol/ol-control-attribution';
import { OLControlGraticuleComponent } from '@lib/ol/ol-control-graticule';
import { OLControlPlusMinusComponent } from '@lib/ol/ol-control-plusminus';
import { OLControlScaleLineComponent } from '@lib/ol/ol-control-scaleline';
import { OLControlSearchParcelsComponent } from '@lib/ol/parcels/ol-control-searchparcels';
import { OLControlSplitScreenComponent } from '@lib/ol/ol-control-splitscreen';
import { OLControlZoomToExtentComponent } from '@lib/ol/ol-control-zoom2extent';
import { OLFilterColorizeComponent } from '@lib/ol/ol-filter-colorize';
import { OLFilterCrop2BoundaryComponent } from '@lib/ol/ol-filter-crop2boundary';
import { OLFilterCrop2PropertyParcelsComponent } from '@lib/ol/property/ol-filter-crop2propertyparcels';
import { OLFilterCrop2SelectedParcelsComponent } from '@lib/ol/parcels/ol-filter-crop2selectedparcels';
import { OLInteractionSelectParcelsComponent } from '@lib/ol/parcels/ol-interaction-selectparcels';
import { OLLayerTileComponent } from '@lib/ol/ol-layer-tile';
import { OLLayerVectorComponent } from '@lib/ol/ol-layer-vector';
import { OLMapComponent } from '@lib/ol/ol-map';
import { OLOverlayGPSComponent } from '@lib/ol/ol-overlay-gps';
import { OLPopupParcelPropertiesComponent } from '@lib/ol/parcels/ol-popup-parcelproperties';
import { OLPopupSelectionComponent } from '@lib/ol/ol-popup-selection';
import { OLSourceBoundaryComponent } from '@lib/ol/ol-source-boundary';
import { OLSourceBoundaryGridComponent } from '@lib/ol/ol-source-boundarygrid';
import { OLSourceBridgesComponent } from '@lib/ol/ol-source-bridges';
import { OLSourceConservationsComponent } from '@lib/ol/ol-source-conservations';
import { OLSourceContours2ftComponent } from '@lib/ol/ol-source-contours-2ft';
import { OLSourceContoursComponent } from '@lib/ol/ol-source-contours';
import { OLSourceDamsComponent } from '@lib/ol/ol-source-dams';
import { OLSourceFloodplainsComponent } from '@lib/ol/ol-source-floodplains';
import { OLSourceGeoJSONComponent } from '@lib/ol/ol-source-geojson';
import { OLSourceHillshadeComponent } from '@lib/ol/ol-source-hillshade';
import { OLSourceLabelsComponent } from '@lib/ol/ol-source-labels';
import { OLSourceLandmarksComponent } from '@lib/ol/ol-source-landmarks';
import { OLSourceOSMComponent } from '@lib/ol/ol-source-osm';
import { OLSourceParcelsComponent } from '@lib/ol/ol-source-parcels';
import { OLSourceRailroadsComponent } from '@lib/ol/ol-source-railroads';
import { OLSourceRiversComponent } from '@lib/ol/ol-source-rivers';
import { OLSourceSatelliteComponent } from '@lib/ol/ol-source-satellite';
import { OLSourceStoneWallsComponent } from '@lib/ol/ol-source-stonewalls';
import { OLSourceWaterbodiesComponent } from '@lib/ol/ol-source-waterbodies';
import { OLSourceWetlandComponent } from '@lib/ol/ol-source-wetland';
import { OLSourceXYZComponent } from '@lib/ol/ol-source-xyz';
import { OLStyleGraticuleComponent } from '@lib/ol/ol-style-graticule';
import { OLStyleParcelsComponent } from '@lib/ol/ol-style-parcels';
import { OLStylePatternDirective } from '@lib/ol/ol-style-pattern';
import { OLStylePlacesComponent } from '@lib/ol/ol-style-places';
import { OLStylePowerlinesComponent } from '@lib/ol/ol-style-powerlines';
import { OLStyleRoadsComponent } from '@lib/ol/ol-style-roads';
import { OLStyleStoneWallsComponent } from '@lib/ol/ol-style-stonewalls';
import { OLStyleUniversalComponent } from '@lib/ol/ol-style-universal';
import { OLStyleWaterbodiesComponent } from '@lib/ol/ol-style-waterbodies';
import { OLStyleWetlandComponent } from '@lib/ol/ol-style-wetland';
import { OverlayState } from '@lib/state/overlay';
import { ParcelsState } from '@lib/state/parcels';
import { PathLocationStrategy } from '@angular/common';
import { ReadyResolver } from '@lib/resolvers/ready';
import { RouterModule } from '@angular/router';
import { ServiceWorkerModule } from '@angular/service-worker';
import { UndoState } from '@lib/state/undo';
import { VersionDialogComponent } from '@lib/components/version-dialog';
import { ViewState } from '@lib/state/view';

import { connectAuthEmulator } from '@angular/fire/auth';
import { connectFirestoreEmulator } from '@angular/fire/firestore';
import { enableMultiTabIndexedDbPersistence } from '@angular/fire/firestore';
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
import { faQuestionCircle } from '@fortawesome/free-solid-svg-icons';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import { faSync } from '@fortawesome/free-solid-svg-icons';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { getAnalytics } from '@angular/fire/analytics';
import { getAuth } from '@angular/fire/auth';
import { getFirestore } from '@angular/fire/firestore';
import { initializeApp } from '@angular/fire/app';
import { initializeAppProvider } from '@lib/services/initializer';
import { provideAnalytics } from '@angular/fire/analytics';
import { provideAuth } from '@angular/fire/auth';
import { provideFirebaseApp } from '@angular/fire/app';
import { provideFirestore } from '@angular/fire/firestore';

let resolvePersistenceEnabled: (enabled: boolean) => void;

export const persistenceEnabled = new Promise<boolean>((resolve) => {
  resolvePersistenceEnabled = resolve;
});

const COMPONENTS = [
  ConfirmDialogComponent,
  MessageDialogComponent,
  OLAdaptorBoundaryComponent,
  OLAdaptorBridgesComponent,
  OLAdaptorBuildingsComponent,
  OLAdaptorConservationsComponent,
  OLAdaptorFloodplainsComponent,
  OLAdaptorGeoJSONComponent,
  OLAdaptorRailroadsComponent,
  OLAdaptorTrailsComponent,
  OLAttributionComponent,
  OLControlAttributionComponent,
  OLControlGraticuleComponent,
  OLControlPlusMinusComponent,
  OLControlScaleLineComponent,
  OLControlSearchParcelsComponent,
  OLControlSplitScreenComponent,
  OLControlZoomToExtentComponent,
  OLFilterColorizeComponent,
  OLFilterCrop2BoundaryComponent,
  OLFilterCrop2PropertyParcelsComponent,
  OLFilterCrop2SelectedParcelsComponent,
  OLInteractionSelectParcelsComponent,
  OLLayerTileComponent,
  OLLayerVectorComponent,
  OLMapComponent,
  OLOverlayGPSComponent,
  OLPopupParcelPropertiesComponent,
  OLPopupSelectionComponent,
  OLSourceBoundaryComponent,
  OLSourceBoundaryGridComponent,
  OLSourceBridgesComponent,
  OLSourceConservationsComponent,
  OLSourceContours2ftComponent,
  OLSourceContoursComponent,
  OLSourceDamsComponent,
  OLSourceFloodplainsComponent,
  OLSourceGeoJSONComponent,
  OLSourceHillshadeComponent,
  OLSourceLabelsComponent,
  OLSourceLandmarksComponent,
  OLSourceOSMComponent,
  OLSourceParcelsComponent,
  OLSourceRailroadsComponent,
  OLSourceRiversComponent,
  OLSourceSatelliteComponent,
  OLSourceStoneWallsComponent,
  OLSourceWaterbodiesComponent,
  OLSourceWetlandComponent,
  OLSourceXYZComponent,
  OLStyleGraticuleComponent,
  OLStyleParcelsComponent,
  OLStylePatternDirective,
  OLStylePlacesComponent,
  OLStylePowerlinesComponent,
  OLStyleRoadsComponent,
  OLStyleStoneWallsComponent,
  OLStyleUniversalComponent,
  OLStyleWaterbodiesComponent,
  OLStyleWetlandComponent,
  ParcelsLegendComponent,
  ParcelsOverlayComponent,
  PropertyLegendComponent,
  StreetsLegendComponent,
  TopoLegendComponent,
  VersionDialogComponent
];

const DIRECTIVES = [];

const PAGES = [ParcelsPage, PropertyPage, RootPage, StreetsPage, TopoPage];

const ROUTES = [
  {
    path: '',
    resolve: {
      index: IndexResolver,
      ready: ReadyResolver
    },
    children: [
      {
        path: 'parcels',
        component: ParcelsPage
      },
      {
        path: 'parcels-legend',
        component: ParcelsLegendComponent,
        outlet: 'leftSidebar'
      },
      {
        path: 'parcels-overlay',
        component: ParcelsOverlayComponent,
        outlet: 'rightSidebar'
      },
      {
        path: 'property',
        component: PropertyPage
      },
      {
        path: 'property-legend',
        component: PropertyLegendComponent,
        outlet: 'leftSidebar'
      },
      {
        path: 'streets',
        component: StreetsPage
      },
      {
        path: 'streets-legend',
        component: StreetsLegendComponent,
        outlet: 'leftSidebar'
      },
      {
        path: 'topo',
        component: TopoPage
      },
      {
        path: 'topo-legend',
        component: TopoLegendComponent,
        outlet: 'leftSidebar'
      }
    ]
  }
];

const STATES = [
  AnonState,
  LandmarksState,
  MapState,
  OverlayState,
  ParcelsState,
  UndoState,
  ViewState
];
const STATES_SAVED = [OverlayState, ViewState];

@NgModule({
  bootstrap: [RootPage],

  declarations: [...COMPONENTS, ...DIRECTIVES, ...PAGES],

  entryComponents: [],

  imports: [
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
    }),
    // 👇 Firebase modules
    provideAnalytics(() => getAnalytics()),
    provideAuth(() => {
      const auth = getAuth();
      if (!environment.production) {
        connectAuthEmulator(auth, 'http://localhost:9099', {
          disableWarnings: true
        });
      }
      return auth;
    }),
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideFirestore(() => {
      const firestore = getFirestore();
      if (!environment.production) {
        connectFirestoreEmulator(firestore, 'localhost', 8080);
      } else {
        enableMultiTabIndexedDbPersistence(firestore).then(
          () => resolvePersistenceEnabled(true),
          () => resolvePersistenceEnabled(false)
        );
      }
      return firestore;
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
    { provide: LocationStrategy, useClass: PathLocationStrategy }
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
      faQuestionCircle,
      faSearch,
      faSync,
      faTimes
    );
  }
}
