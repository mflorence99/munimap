import { AddParcelComponent } from './pages/parcels/add-parcel';
import { AreaPage } from './pages/area/page';
import { BuilderComponent } from './pages/create/builder';
import { ContextMenuComponent } from './components/contextmenu';
import { ContextMenuHostDirective } from './directives/contextmenu-host';
import { ControlPanelEasyTrailsComponent } from './components/controlpanel-easytrails';
import { ControlPanelPropertiesComponent } from './components/controlpanel-properties';
import { CreatePage } from './pages/create/page';
import { CreatePropertyMapComponent } from './pages/parcels/create-propertymap';
import { ListPage } from './pages/list/page';
import { LoginPage } from './pages/login/login';
import { MergeParcelsComponent } from './pages/parcels/merge-parcels';
import { NavigatorComponent } from './pages/root/navigator';
import { ParcelPropertiesComponent } from './pages/parcels/parcel-properties';
import { ParcelsPage } from './pages/parcels/page';
import { ProfileComponent } from './pages/root/profile';
import { PropertyPage } from './pages/property/page';
import { RootPage } from './pages/root/page';
import { StreetsPage } from './pages/streets/page';
import { SubdivideParcelComponent } from './pages/parcels/subdivide-parcel';
import { TopoPage } from './pages/topo/page';

import * as Sentry from '@sentry/angular';

import { APP_INITIALIZER } from '@angular/core';
import { AuthGuard } from '@angular/fire/auth-guard';
import { AuthPipe } from '@angular/fire/auth-guard';
import { AuthState } from '@lib/state/auth';
import { AvatarModule } from 'ngx-avatar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { ConfirmDialogComponent } from '@lib/components/confirm-dialog';
import { DecimalPipe } from '@angular/common';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { EmailAddressValidator } from '@lib/validators/emailaddress';
import { ErrorHandler } from '@angular/core';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FormsModule } from '@angular/forms';
import { GeoJSONAuthorService } from '@lib/services/geojson-author';
import { GeoJSONService } from '@lib/services/geojson';
import { HttpClientModule } from '@angular/common/http';
import { IndexResolver } from '@lib/resolvers/index';
import { InitializerService } from '@lib/services/initializer';
import { LandmarksState } from '@lib/state/landmarks';
import { LocationStrategy } from '@angular/common';
import { MapState } from '@lib/state/map';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MessageDialogComponent } from '@lib/components/message-dialog';
import { NgModule } from '@angular/core';
import { NgPipesModule } from 'ngx-pipes';
import { NgxsLoggerPluginModule } from '@ngxs/logger-plugin';
import { NgxsModule } from '@ngxs/store';
import { NgxsReduxDevtoolsPluginModule } from '@ngxs/devtools-plugin';
import { NgxsRouterPluginModule } from '@ngxs/router-plugin';
import { NgxsStoragePluginModule } from '@ngxs/storage-plugin';
import { OLAdaptorBoundaryComponent } from '@lib/ol/ol-adaptor-boundary';
import { OLAdaptorBridgesComponent } from '@lib/ol/ol-adaptor-bridges';
import { OLAdaptorBuildingsComponent } from '@lib/ol/ol-adaptor-buildings';
import { OLAdaptorConservationsComponent } from '@lib/ol/ol-adaptor-conservations';
import { OLAdaptorFloodplainsComponent } from '@lib/ol/ol-adaptor-floodplains';
import { OLAdaptorGeoJSONComponent } from '@lib/ol/ol-adaptor-geojson';
import { OLAdaptorLandmarksComponent } from '@lib/ol/ol-adaptor-landmarks';
import { OLAdaptorPlacesComponent } from '@lib/ol/ol-adaptor-places';
import { OLAdaptorPowerlinesComponent } from '@lib/ol/ol-adaptor-powerlines';
import { OLAdaptorRailroadsComponent } from '@lib/ol/ol-adaptor-railroads';
import { OLAdaptorRoadsComponent } from '@lib/ol/ol-adaptor-roads';
import { OLAdaptorStoneWallsComponent } from '@lib/ol/ol-adaptor-stonewalls';
import { OLAdaptorTrailsComponent } from '@lib/ol/ol-adaptor-trails';
import { OLAdaptorWaterbodiesComponent } from '@lib/ol/ol-adaptor-waterbodies';
import { OLAdaptorWetlandsComponent } from '@lib/ol/ol-adaptor-wetlands';
import { OLAttributionComponent } from '@lib/ol/ol-attribution';
import { OLControlAttributionComponent } from '@lib/ol/ol-control-attribution';
import { OLControlCreditsComponent } from '@lib/ol/ol-control-credits';
import { OLControlExportParcelsComponent } from '@lib/ol/parcels/ol-control-exportparcels';
import { OLControlGraticuleComponent } from '@lib/ol/ol-control-graticule';
import { OLControlMousePositionComponent } from '@lib/ol/ol-control-mouseposition';
import { OLControlParcelsLegendComponent } from '@lib/ol/parcels/ol-control-parcelslegend';
import { OLControlPrintComponent } from '@lib/ol/ol-control-print';
import { OLControlPrintProgressComponent } from '@lib/ol/ol-control-printprogress';
import { OLControlScaleLineComponent } from '@lib/ol/ol-control-scaleline';
import { OLControlSearchParcelsComponent } from '@lib/ol/parcels/ol-control-searchparcels';
import { OLControlStreetsLegendComponent } from '@lib/ol/streets/ol-control-streetslegend';
import { OLControlTitleComponent } from '@lib/ol/ol-control-title';
import { OLControlTopoLegendComponent } from '@lib/ol/topo/ol-control-topolegend';
import { OLControlZoomComponent } from '@lib/ol/ol-control-zoom';
import { OLControlZoomToExtentComponent } from '@lib/ol/ol-control-zoom2extent';
import { OLFilterColorizeComponent } from '@lib/ol/ol-filter-colorize';
import { OLFilterCrop2BoundaryComponent } from '@lib/ol/ol-filter-crop2boundary';
import { OLFilterCrop2PropertyParcelsComponent } from '@lib/ol/property/ol-filter-crop2propertyparcels';
import { OLFilterPencilComponent } from '@lib/ol/ol-filter-pencil';
import { OLInteractionDrawLandmarkComponent } from '@lib/ol/landmarks/ol-interaction-drawlandmark';
import { OLInteractionRedrawBoundaryComponent } from '@lib/ol/ol-interaction-redrawboundary';
import { OLInteractionRedrawLandmarkComponent } from '@lib/ol/landmarks/ol-interaction-redrawlandmark';
import { OLInteractionRedrawParcelComponent } from '@lib/ol/parcels/ol-interaction-redrawparcel';
import { OLInteractionSelectGeoJSONComponent } from '@lib/ol/ol-interaction-selectgeojson';
import { OLInteractionSelectLandmarkComponent } from '@lib/ol/landmarks/ol-interaction-selectlandmark';
import { OLInteractionSelectParcelsComponent } from '@lib/ol/parcels/ol-interaction-selectparcels';
import { OLLayerTileComponent } from '@lib/ol/ol-layer-tile';
import { OLLayerVectorComponent } from '@lib/ol/ol-layer-vector';
import { OLMapComponent } from '@lib/ol/ol-map';
import { OLOverlayLandmarkLabelComponent } from '@lib/ol/landmarks/ol-overlay-landmarklabel';
import { OLOverlayParcelLabelComponent } from '@lib/ol/parcels/ol-overlay-parcellabel';
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
import { OLSourceStoneWallsComponent } from '@lib/ol/ol-source-stonewalls';
import { OLSourceWaterbodiesComponent } from '@lib/ol/ol-source-waterbodies';
import { OLSourceWetlandsComponent } from '@lib/ol/ol-source-wetlands';
import { OLSourceXYZComponent } from '@lib/ol/ol-source-xyz';
import { OLStyleGraticuleComponent } from '@lib/ol/ol-style-graticule';
import { OLStyleParcelsComponent } from '@lib/ol/ol-style-parcels';
import { OLStylePatternDirective } from '@lib/ol/ol-style-pattern';
import { OLStyleUniversalComponent } from '@lib/ol/ol-style-universal';
import { OverlayModule } from '@angular/cdk/overlay';
import { OverlayState } from '@lib/state/overlay';
import { ParcelIDValidator } from '@lib/validators/parcelid';
import { ParcelsState } from '@lib/state/parcels';
import { PathLocationStrategy } from '@angular/common';
import { ReadyResolver } from '@lib/resolvers/ready';
import { RouterModule } from '@angular/router';
import { RouterState } from '@ngxs/router-plugin';
import { ServiceWorkerModule } from '@angular/service-worker';
import { SubdivisionIDValidator } from '@lib/validators/subdivisionid';
import { UndoState } from '@lib/state/undo';
import { VersionDialogComponent } from '@lib/components/version-dialog';
import { ViewState } from '@lib/state/view';
import { WorkgroupValidator } from '@lib/validators/workgroup';

import { connectAuthEmulator } from '@angular/fire/auth';
import { connectFirestoreEmulator } from '@angular/fire/firestore';
import { enableMultiTabIndexedDbPersistence } from '@angular/fire/firestore';
import { environment } from '@lib/environment';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import { faCircleExclamation } from '@fortawesome/pro-duotone-svg-icons';
import { faCrosshairs } from '@fortawesome/free-solid-svg-icons';
import { faDownload } from '@fortawesome/free-solid-svg-icons';
import { faDrawPolygon } from '@fortawesome/free-solid-svg-icons';
import { faExclamationTriangle } from '@fortawesome/pro-duotone-svg-icons';
import { faExpandArrows } from '@fortawesome/pro-solid-svg-icons';
import { faGlobeAmericas } from '@fortawesome/pro-duotone-svg-icons';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { faLayerGroup } from '@fortawesome/pro-duotone-svg-icons';
import { faLayerPlus } from '@fortawesome/pro-duotone-svg-icons';
import { faList } from '@fortawesome/pro-duotone-svg-icons';
import { faLocationPlus as fadLocationPlus } from '@fortawesome/pro-duotone-svg-icons';
import { faLocationPlus as fasLocationPlus } from '@fortawesome/pro-solid-svg-icons';
import { faObjectGroup as fadObjectGroup } from '@fortawesome/pro-duotone-svg-icons';
import { faObjectGroup as fasObjectGroup } from '@fortawesome/free-solid-svg-icons';
import { faObjectUngroup as fadObjectUngroup } from '@fortawesome/pro-duotone-svg-icons';
import { faObjectUngroup as fasObjectUngroup } from '@fortawesome/free-solid-svg-icons';
import { faPen } from '@fortawesome/free-solid-svg-icons';
import { faPlusSquare as fadPlusSquare } from '@fortawesome/pro-duotone-svg-icons';
import { faPlusSquare as fasPlusSquare } from '@fortawesome/free-solid-svg-icons';
import { faPrint } from '@fortawesome/free-solid-svg-icons';
import { faQuestionCircle } from '@fortawesome/free-solid-svg-icons';
import { faRedo } from '@fortawesome/pro-duotone-svg-icons';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import { faSignIn } from '@fortawesome/pro-duotone-svg-icons';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { faSync } from '@fortawesome/pro-duotone-svg-icons';
import { faTasks as fadTasks } from '@fortawesome/pro-duotone-svg-icons';
import { faTasks as fasTasks } from '@fortawesome/free-solid-svg-icons';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { faUndo } from '@fortawesome/pro-duotone-svg-icons';
import { getAnalytics } from '@angular/fire/analytics';
import { getAuth } from '@angular/fire/auth';
import { getFirestore } from '@angular/fire/firestore';
import { initializeApp } from '@angular/fire/app';
import { initializeAppProvider } from '@lib/services/initializer';
import { provideAnalytics } from '@angular/fire/analytics';
import { provideAuth } from '@angular/fire/auth';
import { provideFirebaseApp } from '@angular/fire/app';
import { provideFirestore } from '@angular/fire/firestore';
import { redirectLoggedInTo } from '@angular/fire/auth-guard';
import { redirectUnauthorizedTo } from '@angular/fire/auth-guard';

let resolvePersistenceEnabled: (enabled: boolean) => void;

export const persistenceEnabled = new Promise<boolean>((resolve) => {
  resolvePersistenceEnabled = resolve;
});

const COMPONENTS = [
  AddParcelComponent,
  BuilderComponent,
  ConfirmDialogComponent,
  ContextMenuComponent,
  ControlPanelEasyTrailsComponent,
  ControlPanelPropertiesComponent,
  CreatePropertyMapComponent,
  EmailAddressValidator,
  MergeParcelsComponent,
  MessageDialogComponent,
  NavigatorComponent,
  OLAdaptorBoundaryComponent,
  OLAdaptorBridgesComponent,
  OLAdaptorBuildingsComponent,
  OLAdaptorConservationsComponent,
  OLAdaptorFloodplainsComponent,
  OLAdaptorGeoJSONComponent,
  OLAdaptorLandmarksComponent,
  OLAdaptorPlacesComponent,
  OLAdaptorPowerlinesComponent,
  OLAdaptorRailroadsComponent,
  OLAdaptorRoadsComponent,
  OLAdaptorStoneWallsComponent,
  OLAdaptorTrailsComponent,
  OLAdaptorWaterbodiesComponent,
  OLAdaptorWetlandsComponent,
  OLAttributionComponent,
  OLControlAttributionComponent,
  OLControlCreditsComponent,
  OLControlExportParcelsComponent,
  OLControlGraticuleComponent,
  OLControlMousePositionComponent,
  OLControlParcelsLegendComponent,
  OLControlPrintComponent,
  OLControlPrintProgressComponent,
  OLControlScaleLineComponent,
  OLControlSearchParcelsComponent,
  OLControlStreetsLegendComponent,
  OLControlTitleComponent,
  OLControlTopoLegendComponent,
  OLControlZoomComponent,
  OLControlZoomToExtentComponent,
  OLFilterColorizeComponent,
  OLFilterCrop2BoundaryComponent,
  OLFilterCrop2PropertyParcelsComponent,
  OLFilterPencilComponent,
  OLInteractionDrawLandmarkComponent,
  OLInteractionRedrawBoundaryComponent,
  OLInteractionRedrawLandmarkComponent,
  OLInteractionRedrawParcelComponent,
  OLInteractionSelectGeoJSONComponent,
  OLInteractionSelectLandmarkComponent,
  OLInteractionSelectParcelsComponent,
  OLLayerTileComponent,
  OLLayerVectorComponent,
  OLMapComponent,
  OLOverlayLandmarkLabelComponent,
  OLOverlayParcelLabelComponent,
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
  OLSourceStoneWallsComponent,
  OLSourceWaterbodiesComponent,
  OLSourceWetlandsComponent,
  OLSourceXYZComponent,
  OLStyleGraticuleComponent,
  OLStyleParcelsComponent,
  OLStylePatternDirective,
  OLStyleUniversalComponent,
  ParcelIDValidator,
  ParcelPropertiesComponent,
  ProfileComponent,
  SubdivideParcelComponent,
  SubdivisionIDValidator,
  VersionDialogComponent
];

const DIRECTIVES = [ContextMenuHostDirective, WorkgroupValidator];

const PAGES = [
  AreaPage,
  LoginPage,
  CreatePage,
  ListPage,
  ParcelsPage,
  PropertyPage,
  RootPage,
  StreetsPage,
  TopoPage
];

const redirectUnauthorizedToLogin = (): AuthPipe =>
  redirectUnauthorizedTo(['login']);
const redirectLoggedInToMaps = (): AuthPipe => redirectLoggedInTo(['create']);

const ROUTES = [
  {
    path: 'login',
    component: LoginPage,
    canActivate: [AuthGuard],
    data: { authGuardPipe: redirectLoggedInToMaps, state: 'login' }
  },
  {
    path: '',
    canActivate: [AuthGuard],
    data: { authGuardPipe: redirectUnauthorizedToLogin },
    resolve: {
      index: IndexResolver,
      ready: ReadyResolver
    },
    children: [
      {
        path: 'area/:id',
        component: AreaPage,
        data: { state: 'area' }
      },
      {
        path: 'create',
        component: CreatePage,
        data: { state: 'create' }
      },
      {
        path: 'list',
        component: ListPage,
        data: { state: 'list' }
      },
      {
        path: 'parcels/:id',
        component: ParcelsPage,
        data: { state: 'parcels' }
      },
      {
        path: 'property/:id',
        component: PropertyPage,
        data: { state: 'property' }
      },
      {
        path: 'streets/:id',
        component: StreetsPage,
        data: { state: 'streets' }
      },
      {
        path: 'topo/:id',
        component: TopoPage,
        data: { state: 'topo' }
      },
      { path: '', redirectTo: '/login', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: '/login', pathMatch: 'full' }
];

const STATES = [
  AuthState,
  LandmarksState,
  MapState,
  OverlayState,
  ParcelsState,
  UndoState,
  ViewState
];
const STATES_SAVED = [OverlayState, RouterState, ViewState];

@NgModule({
  bootstrap: [RootPage],

  declarations: [...COMPONENTS, ...DIRECTIVES, ...PAGES],

  entryComponents: [],

  imports: [
    AvatarModule,
    BrowserAnimationsModule,
    BrowserModule,
    CommonModule,
    DragDropModule,
    FontAwesomeModule,
    FormsModule,
    HttpClientModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatCardModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatMenuModule,
    MatProgressBarModule,
    MatRadioModule,
    MatSelectModule,
    MatSidenavModule,
    MatSortModule,
    MatTableModule,
    MatToolbarModule,
    MatTooltipModule,
    NgPipesModule,
    NgxsModule.forRoot(STATES, {
      developmentMode: !environment.production
    }),
    NgxsLoggerPluginModule.forRoot({ collapsed: false }),
    NgxsReduxDevtoolsPluginModule.forRoot({
      disabled: environment.production
    }),
    NgxsRouterPluginModule.forRoot(),
    NgxsStoragePluginModule.forRoot({
      beforeSerialize: (obj, key) => {
        // 👉 we ONLY want to save the URL
        //    problem: we store large amounts of data in "data"
        if (key === 'router') obj = { state: { url: obj.state.url } };
        return obj;
      },
      key: STATES_SAVED
    }),
    OverlayModule,
    RouterModule.forRoot(ROUTES, { onSameUrlNavigation: 'reload' }),
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: environment.production,
      registrationStrategy: 'registerImmediately'
    }),
    // 👇 Firebase modules
    provideFirebaseApp(() => initializeApp(environment.firebase)),
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
    { provide: GeoJSONService, useClass: GeoJSONAuthorService },
    { provide: LocationStrategy, useClass: PathLocationStrategy }
  ]
})
export class RootModule {
  constructor(library: FaIconLibrary) {
    // 👇 must add icons we use right here
    library.addIcons(
      faBars,
      faCircleExclamation,
      faCrosshairs,
      faDownload,
      faDrawPolygon,
      faExclamationTriangle,
      faExpandArrows,
      faGlobeAmericas,
      faInfoCircle,
      faLayerGroup,
      faLayerPlus,
      faList,
      fadLocationPlus,
      fasLocationPlus,
      fadObjectGroup,
      fasObjectGroup,
      fadObjectUngroup,
      fasObjectUngroup,
      faPen,
      fadPlusSquare,
      fasPlusSquare,
      faPrint,
      faQuestionCircle,
      faRedo,
      faSearch,
      faSignIn,
      faSpinner,
      faSync,
      fadTasks,
      fasTasks,
      faTimes,
      faTrash,
      faUndo
    );
  }
}
