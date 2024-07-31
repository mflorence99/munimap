import { AvatarComponent } from './components/avatar';
import { ContextMenuComponent } from './components/contextmenu';
import { ControlPanelPropertiesComponent } from './components/controlpanel-properties';
import { AutoFocusDirective } from './directives/autofocus';
import { ContextMenuHostDirective } from './directives/contextmenu-host';
import { SelectOnFocusDirective } from './directives/select-on-focus';
import { APDVDPage } from './pages/apdvd/page';
import { AreaPage } from './pages/area/page';
import { BuilderComponent } from './pages/create/builder';
import { CreatePage } from './pages/create/page';
import { CulvertPropertiesComponent } from './pages/dpw/culvert-properties';
import { ImportCulvertsComponent } from './pages/dpw/import-culverts';
import { DPWPage } from './pages/dpw/page';
import { ListPage } from './pages/list/page';
import { LoginPage } from './pages/login/login';
import { AddParcelComponent } from './pages/parcels/add-parcel';
import { CreatePropertyMapComponent } from './pages/parcels/create-propertymap';
import { MergeParcelsComponent } from './pages/parcels/merge-parcels';
import { ParcelsPage } from './pages/parcels/page';
import { ParcelPropertiesComponent } from './pages/parcels/parcel-properties';
import { SubdivideParcelComponent } from './pages/parcels/subdivide-parcel';
import { ImportLandmarksComponent } from './pages/property/import-landmarks';
import { LandmarkPropertiesComponent } from './pages/property/landmark-properties';
import { PropertyPage } from './pages/property/page';
import { NavigatorComponent } from './pages/root/navigator';
import { RootPage } from './pages/root/page';
import { ProfileComponent } from './pages/root/profile';

import * as Sentry from '@sentry/angular-ivy';

import { DragDropModule } from '@angular/cdk/drag-drop';
import { OverlayModule } from '@angular/cdk/overlay';
import { CommonModule } from '@angular/common';
import { DecimalPipe } from '@angular/common';
import { LocationStrategy } from '@angular/common';
import { PathLocationStrategy } from '@angular/common';
import { TitleCasePipe } from '@angular/common';
import { APP_INITIALIZER } from '@angular/core';
import { ErrorHandler } from '@angular/core';
import { NgModule } from '@angular/core';
import { AuthGuard } from '@angular/fire/auth-guard';
import { AuthPipe } from '@angular/fire/auth-guard';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
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
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { ServiceWorkerModule } from '@angular/service-worker';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ConfirmDialogComponent } from '@lib/components/confirm-dialog';
import { MessageDialogComponent } from '@lib/components/message-dialog';
import { VersionDialogComponent } from '@lib/components/version-dialog';
import { OLAdaptorBackgroundComponent } from '@lib/ol/ol-adaptor-background';
import { OLAdaptorBoundaryComponent } from '@lib/ol/ol-adaptor-boundary';
import { OLAdaptorBridgesComponent } from '@lib/ol/ol-adaptor-bridges';
import { OLAdaptorBuildingsComponent } from '@lib/ol/ol-adaptor-buildings';
import { OLAdaptorBuildingsAtNightComponent } from '@lib/ol/ol-adaptor-buildingsatnight';
import { OLAdaptorConservationsComponent } from '@lib/ol/ol-adaptor-conservations';
import { OLAdaptorCulvertsComponent } from '@lib/ol/ol-adaptor-culverts';
import { OLAdaptorDPWLandmarksComponent } from '@lib/ol/ol-adaptor-dpwlandmarks';
import { OLAdaptorFloodHazardsComponent } from '@lib/ol/ol-adaptor-floodhazards';
import { OLAdaptorFloodplainsComponent } from '@lib/ol/ol-adaptor-floodplains';
import { OLAdaptorGeoJSONComponent } from '@lib/ol/ol-adaptor-geojson';
import { OLAdaptorLandmarksComponent } from '@lib/ol/ol-adaptor-landmarks';
import { OLAdaptorPlacesComponent } from '@lib/ol/ol-adaptor-places';
import { OLAdaptorPowerlinesComponent } from '@lib/ol/ol-adaptor-powerlines';
import { OLAdaptorRailroadsComponent } from '@lib/ol/ol-adaptor-railroads';
import { OLAdaptorRoadsComponent } from '@lib/ol/ol-adaptor-roads';
import { OLAdaptorStoneWallsComponent } from '@lib/ol/ol-adaptor-stonewalls';
import { OLAdaptorStreamCrossingsComponent } from '@lib/ol/ol-adaptor-streamcrossings';
import { OLAdaptorTrailsComponent } from '@lib/ol/ol-adaptor-trails';
import { OLAdaptorWaterbodiesComponent } from '@lib/ol/ol-adaptor-waterbodies';
import { OLAdaptorWaterbodiesAtNightComponent } from '@lib/ol/ol-adaptor-waterbodiesatnight';
import { OLAdaptorWetlandsComponent } from '@lib/ol/ol-adaptor-wetlands';
import { OLAttributionComponent } from '@lib/ol/ol-attribution';
import { OLControlAPDVDLegendComponent } from '@lib/ol/ol-control-apdvdlegend';
import { OLControlAttributionComponent } from '@lib/ol/ol-control-attribution';
import { OLControlCreditsComponent } from '@lib/ol/ol-control-credits';
import { OLControlExportCulvertsComponent } from '@lib/ol/ol-control-exportculverts';
import { OLControlExportLandmarksComponent } from '@lib/ol/ol-control-exportlandmarks';
import { OLControlExportLayersComponent } from '@lib/ol/ol-control-exportlayers';
import { OLControlExportParcelsComponent } from '@lib/ol/ol-control-exportparcels';
import { OLControlGraticuleComponent } from '@lib/ol/ol-control-graticule';
import { OLControlMousePositionComponent } from '@lib/ol/ol-control-mouseposition';
import { OLControlParcelsLegendComponent } from '@lib/ol/ol-control-parcelslegend';
import { OLControlPrintComponent } from '@lib/ol/ol-control-print';
import { OLControlPrintProgressComponent } from '@lib/ol/ol-control-printprogress';
import { OLControlScaleBarComponent } from '@lib/ol/ol-control-scalebar';
import { OLControlScaleLineComponent } from '@lib/ol/ol-control-scaleline';
import { OLControlSearchParcelsComponent } from '@lib/ol/ol-control-searchparcels';
import { OLControlTitleComponent } from '@lib/ol/ol-control-title';
import { OLControlZoomComponent } from '@lib/ol/ol-control-zoom';
import { OLControlZoomToExtentComponent } from '@lib/ol/ol-control-zoom2extent';
import { OLFilterColorizeComponent } from '@lib/ol/ol-filter-colorize';
import { OLFilterCrop2BoundaryComponent } from '@lib/ol/ol-filter-crop2boundary';
import { OLFilterCrop2PropertyParcelsComponent } from '@lib/ol/ol-filter-crop2propertyparcels';
import { OLFilterPencilComponent } from '@lib/ol/ol-filter-pencil';
import { OLInteractionDrawLandmarksComponent } from '@lib/ol/ol-interaction-drawlandmarks';
import { OLInteractionRedrawBoundaryComponent } from '@lib/ol/ol-interaction-redrawboundary';
import { OLInteractionRedrawLandmarkComponent } from '@lib/ol/ol-interaction-redrawlandmark';
import { OLInteractionRedrawParcelComponent } from '@lib/ol/ol-interaction-redrawparcel';
import { OLInteractionSelectGeoJSONComponent } from '@lib/ol/ol-interaction-selectgeojson';
import { OLInteractionSelectLandmarksComponent } from '@lib/ol/ol-interaction-selectlandmarks';
import { OLInteractionSelectParcelsComponent } from '@lib/ol/ol-interaction-selectparcels';
import { OLLayerTileComponent } from '@lib/ol/ol-layer-tile';
import { OLLayerVectorComponent } from '@lib/ol/ol-layer-vector';
import { OLMapComponent } from '@lib/ol/ol-map';
import { OLOverlayLandmarkLabelComponent } from '@lib/ol/ol-overlay-landmarklabel';
import { OLOverlayParcelLabelComponent } from '@lib/ol/ol-overlay-parcellabel';
import { OLSourceBBoxComponent } from '@lib/ol/ol-source-bbox';
import { OLSourceBoundaryComponent } from '@lib/ol/ol-source-boundary';
import { OLSourceBoundaryGridComponent } from '@lib/ol/ol-source-boundarygrid';
import { OLSourceBridgesComponent } from '@lib/ol/ol-source-bridges';
import { OLSourceConservationsComponent } from '@lib/ol/ol-source-conservations';
import { OLSourceContoursComponent } from '@lib/ol/ol-source-contours';
import { OLSourceContours2ftComponent } from '@lib/ol/ol-source-contours-2ft';
import { OLSourceDamsComponent } from '@lib/ol/ol-source-dams';
import { OLSourceFloodHazardsComponent } from '@lib/ol/ol-source-floodhazards';
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
import { OLSourceStreamCrossingsComponent } from '@lib/ol/ol-source-streamcrossings';
import { OLSourceWaterbodiesComponent } from '@lib/ol/ol-source-waterbodies';
import { OLSourceWetlandsComponent } from '@lib/ol/ol-source-wetlands';
import { OLSourceXYZComponent } from '@lib/ol/ol-source-xyz';
import { OLStyleGraticuleComponent } from '@lib/ol/ol-style-graticule';
import { OLStyleParcelsComponent } from '@lib/ol/ol-style-parcels';
import { OLStylePatternDirective } from '@lib/ol/ol-style-pattern';
import { OLStyleUniversalComponent } from '@lib/ol/ol-style-universal';
import { TimesPipe } from '@lib/pipes/times';
import { IndexResolver } from '@lib/resolvers/index';
import { ReadyResolver } from '@lib/resolvers/ready';
import { GeoJSONService } from '@lib/services/geojson';
import { GeoJSONAuthorService } from '@lib/services/geojson-author';
import { InitializerService } from '@lib/services/initializer';
import { AuthState } from '@lib/state/auth';
import { LandmarksState } from '@lib/state/landmarks';
import { MapState } from '@lib/state/map';
import { ParcelsState } from '@lib/state/parcels';
import { UndoState } from '@lib/state/undo';
import { ViewState } from '@lib/state/view';
import { WorkingState } from '@lib/state/working';
import { EmailAddressValidator } from '@lib/validators/emailaddress';
import { ParcelIDValidator } from '@lib/validators/parcelid';
import { SubdivisionIDValidator } from '@lib/validators/subdivisionid';
import { WorkgroupValidator } from '@lib/validators/workgroup';
import { NgxsReduxDevtoolsPluginModule } from '@ngxs/devtools-plugin';
import { NgxsLoggerPluginModule } from '@ngxs/logger-plugin';
import { NgxsRouterPluginModule } from '@ngxs/router-plugin';
import { RouterState } from '@ngxs/router-plugin';
import { NgxsStoragePluginModule } from '@ngxs/storage-plugin';
import { NgxsModule } from '@ngxs/store';
import { NgPipesModule } from 'ngx-pipes';

import { provideHttpClient } from '@angular/common/http';
import { getAnalytics } from '@angular/fire/analytics';
import { provideAnalytics } from '@angular/fire/analytics';
import { initializeApp } from '@angular/fire/app';
import { provideFirebaseApp } from '@angular/fire/app';
import { connectAuthEmulator } from '@angular/fire/auth';
import { getAuth } from '@angular/fire/auth';
import { provideAuth } from '@angular/fire/auth';
import { redirectLoggedInTo } from '@angular/fire/auth-guard';
import { redirectUnauthorizedTo } from '@angular/fire/auth-guard';
import { connectFirestoreEmulator } from '@angular/fire/firestore';
import { enableMultiTabIndexedDbPersistence } from '@angular/fire/firestore';
import { getFirestore } from '@angular/fire/firestore';
import { provideFirestore } from '@angular/fire/firestore';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import { faCrosshairs } from '@fortawesome/free-solid-svg-icons';
import { faDownload } from '@fortawesome/free-solid-svg-icons';
import { faDrawPolygon } from '@fortawesome/free-solid-svg-icons';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { faObjectGroup as fasObjectGroup } from '@fortawesome/free-solid-svg-icons';
import { faObjectUngroup as fasObjectUngroup } from '@fortawesome/free-solid-svg-icons';
import { faPen } from '@fortawesome/free-solid-svg-icons';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { faPlusSquare as fasPlusSquare } from '@fortawesome/free-solid-svg-icons';
import { faPrint } from '@fortawesome/free-solid-svg-icons';
import { faQuestionCircle } from '@fortawesome/free-solid-svg-icons';
import { faRecycle } from '@fortawesome/free-solid-svg-icons';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { faTasks as fasTasks } from '@fortawesome/free-solid-svg-icons';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { faCircleExclamation } from '@fortawesome/pro-duotone-svg-icons';
import { faExclamationTriangle } from '@fortawesome/pro-duotone-svg-icons';
import { faFileImport as fadFileImport } from '@fortawesome/pro-duotone-svg-icons';
import { faGlobeAmericas } from '@fortawesome/pro-duotone-svg-icons';
import { faLayerGroup } from '@fortawesome/pro-duotone-svg-icons';
import { faLayerPlus } from '@fortawesome/pro-duotone-svg-icons';
import { faList } from '@fortawesome/pro-duotone-svg-icons';
import { faLocationPlus as fadLocationPlus } from '@fortawesome/pro-duotone-svg-icons';
import { faObjectGroup as fadObjectGroup } from '@fortawesome/pro-duotone-svg-icons';
import { faObjectUngroup as fadObjectUngroup } from '@fortawesome/pro-duotone-svg-icons';
import { faPlusSquare as fadPlusSquare } from '@fortawesome/pro-duotone-svg-icons';
import { faRedo } from '@fortawesome/pro-duotone-svg-icons';
import { faSignIn } from '@fortawesome/pro-duotone-svg-icons';
import { faSync } from '@fortawesome/pro-duotone-svg-icons';
import { faTasks as fadTasks } from '@fortawesome/pro-duotone-svg-icons';
import { faUndo } from '@fortawesome/pro-duotone-svg-icons';
import { faFileImport as farFileImport } from '@fortawesome/pro-regular-svg-icons';
import { faFileSignature } from '@fortawesome/pro-regular-svg-icons';
import { faExpandArrows } from '@fortawesome/pro-solid-svg-icons';
import { faLocationPlus as fasLocationPlus } from '@fortawesome/pro-solid-svg-icons';
import { faRotate } from '@fortawesome/pro-solid-svg-icons';
import { faSplit } from '@fortawesome/pro-solid-svg-icons';
import { environment } from '@lib/environment';
import { initializeAppProvider } from '@lib/services/initializer';

let resolvePersistenceEnabled: (enabled: boolean) => void;

export const persistenceEnabled = new Promise<boolean>((resolve) => {
  resolvePersistenceEnabled = resolve;
});

const COMPONENTS = [
  AddParcelComponent,
  AvatarComponent,
  BuilderComponent,
  ConfirmDialogComponent,
  ContextMenuComponent,
  ControlPanelPropertiesComponent,
  CreatePropertyMapComponent,
  CulvertPropertiesComponent,
  EmailAddressValidator,
  ImportCulvertsComponent,
  ImportLandmarksComponent,
  LandmarkPropertiesComponent,
  MergeParcelsComponent,
  MessageDialogComponent,
  NavigatorComponent,
  OLAdaptorBackgroundComponent,
  OLAdaptorBoundaryComponent,
  OLAdaptorBridgesComponent,
  OLAdaptorBuildingsComponent,
  OLAdaptorBuildingsAtNightComponent,
  OLAdaptorConservationsComponent,
  OLAdaptorCulvertsComponent,
  OLAdaptorDPWLandmarksComponent,
  OLAdaptorFloodHazardsComponent,
  OLAdaptorFloodplainsComponent,
  OLAdaptorGeoJSONComponent,
  OLAdaptorLandmarksComponent,
  OLAdaptorPlacesComponent,
  OLAdaptorPowerlinesComponent,
  OLAdaptorRailroadsComponent,
  OLAdaptorRoadsComponent,
  OLAdaptorStoneWallsComponent,
  OLAdaptorStreamCrossingsComponent,
  OLAdaptorTrailsComponent,
  OLAdaptorWaterbodiesComponent,
  OLAdaptorWaterbodiesAtNightComponent,
  OLAdaptorWetlandsComponent,
  OLAttributionComponent,
  OLControlAPDVDLegendComponent,
  OLControlAttributionComponent,
  OLControlCreditsComponent,
  OLControlExportCulvertsComponent,
  OLControlExportLandmarksComponent,
  OLControlExportLayersComponent,
  OLControlExportParcelsComponent,
  OLControlGraticuleComponent,
  OLControlMousePositionComponent,
  OLControlParcelsLegendComponent,
  OLControlPrintComponent,
  OLControlPrintProgressComponent,
  OLControlScaleBarComponent,
  OLControlScaleLineComponent,
  OLControlSearchParcelsComponent,
  OLControlTitleComponent,
  OLControlZoomComponent,
  OLControlZoomToExtentComponent,
  OLFilterColorizeComponent,
  OLFilterCrop2BoundaryComponent,
  OLFilterCrop2PropertyParcelsComponent,
  OLFilterPencilComponent,
  OLInteractionDrawLandmarksComponent,
  OLInteractionRedrawBoundaryComponent,
  OLInteractionRedrawLandmarkComponent,
  OLInteractionRedrawParcelComponent,
  OLInteractionSelectGeoJSONComponent,
  OLInteractionSelectLandmarksComponent,
  OLInteractionSelectParcelsComponent,
  OLLayerTileComponent,
  OLLayerVectorComponent,
  OLMapComponent,
  OLOverlayLandmarkLabelComponent,
  OLOverlayParcelLabelComponent,
  OLSourceBBoxComponent,
  OLSourceBoundaryComponent,
  OLSourceBoundaryGridComponent,
  OLSourceBridgesComponent,
  OLSourceConservationsComponent,
  OLSourceContours2ftComponent,
  OLSourceContoursComponent,
  OLSourceDamsComponent,
  OLSourceFloodHazardsComponent,
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
  OLSourceStreamCrossingsComponent,
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

const DIRECTIVES = [
  AutoFocusDirective,
  ContextMenuHostDirective,
  SelectOnFocusDirective,
  WorkgroupValidator
];

const PAGES = [
  APDVDPage,
  AreaPage,
  LoginPage,
  CreatePage,
  DPWPage,
  ListPage,
  ParcelsPage,
  PropertyPage,
  RootPage
];

const PIPES = [TimesPipe];

const redirectUnauthorizedToLogin = (): AuthPipe =>
  redirectUnauthorizedTo(['login']);
const redirectLoggedInToMaps = (): AuthPipe => redirectLoggedInTo(['create']);

// 🔥 type error introduced in Angular v14 -- cause unknown
const ROUTES: any = [
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
        path: 'apdvd/:id',
        component: APDVDPage,
        data: { state: 'apdvd' }
      },
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
        path: 'dpw/:id',
        component: DPWPage,
        data: { state: 'dpw' }
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
      { path: '', redirectTo: '/login', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: '/login', pathMatch: 'full' }
];

const STATES = [
  AuthState,
  LandmarksState,
  MapState,
  ParcelsState,
  UndoState,
  ViewState,
  WorkingState
];
const STATES_SAVED = [RouterState, ViewState];

@NgModule({
  bootstrap: [RootPage],

  declarations: [...COMPONENTS, ...DIRECTIVES, ...PAGES, ...PIPES],

  imports: [
    BrowserAnimationsModule,
    BrowserModule,
    CommonModule,
    DragDropModule,
    FontAwesomeModule,
    FormsModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatCardModule,
    MatCheckboxModule,
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
      developmentMode: !environment.production,
      // 🔥 this changed in v18
      //    we must suppress errors that occure BEFORE state is initialized
      selectorOptions: { suppressErrors: true }
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
      keys: STATES_SAVED
    }),
    OverlayModule,
    RouterModule.forRoot(ROUTES, { onSameUrlNavigation: 'reload' }),
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: environment.production,
      registrationStrategy: 'registerImmediately'
    })
  ],

  providers: [
    DecimalPipe,
    TitleCasePipe,
    provideHttpClient(),
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
    { provide: LocationStrategy, useClass: PathLocationStrategy },
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
  ]
})
export class RootModule {
  constructor(library: FaIconLibrary) {
    // 👇 must add icons we use right here
    library.addIcons(
      faBars,
      faCheck,
      faCircleExclamation,
      faCrosshairs,
      faDownload,
      faDrawPolygon,
      faExclamationTriangle,
      faExpandArrows,
      fadFileImport,
      farFileImport,
      faFileSignature,
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
      faPlus,
      fadPlusSquare,
      fasPlusSquare,
      faPrint,
      faQuestionCircle,
      faRecycle,
      faRedo,
      faRotate,
      faSearch,
      faSignIn,
      faSplit,
      faSpinner,
      faSync,
      fadTasks,
      fasTasks,
      faTimes,
      faTrash,
      faUndo,
      faXmark
    );
  }
}
