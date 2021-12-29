import { AddParcelComponent } from './contextmenu/add-parcel';
import { BuilderComponent } from './pages/create/builder';
import { ContextMenuHostDirective } from './contextmenu/contextmenu-host';
import { CreatePage } from './pages/create/page';
import { LoginPage } from './pages/login/login';
import { MergeParcelsComponent } from './contextmenu/merge-parcels';
import { NavigatorComponent } from './pages/root/navigator';
import { ParcelPropertiesComponent } from './contextmenu/parcel-properties';
import { ParcelsPage } from './pages/parcels/page';
import { ProfileComponent } from './pages/root/profile';
import { PropertiesComponent } from './pages/properties';
import { RootPage } from './pages/root/page';
import { SubdivideParcelComponent } from './contextmenu/subdivide-parcel';

import * as Sentry from '@sentry/angular';

import { AngularFireAuthGuard } from '@angular/fire/auth-guard';
import { AngularFireAuthModule } from '@angular/fire/auth';
import { AngularFireModule } from '@angular/fire';
import { APP_INITIALIZER } from '@angular/core';
import { AuthPipe } from '@angular/fire/auth-guard';
import { AuthState } from '@lib/state/auth';
import { AvatarModule } from 'ngx-avatar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { ConfirmDialogComponent } from '@lib/components/confirm-dialog';
import { DecimalPipe } from '@angular/common';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { ErrorHandler } from '@angular/core';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { FirebaseUIModule } from 'firebaseui-angular';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FormsModule } from '@angular/forms';
import { GeoJSONAuthorService } from '@lib/services/geojson-author';
import { GeoJSONService } from '@lib/services/geojson';
import { HttpClientModule } from '@angular/common/http';
import { IndexResolver } from '@lib/resolvers/index';
import { InitializerService } from '@lib/services/initializer';
import { LocationStrategy } from '@angular/common';
import { MapState } from '@lib/state/map';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
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
import { OLAttributionComponent } from '@lib/ol/ol-attribution';
import { OLControlAttributionComponent } from '@lib/ol/ol-control-attribution';
import { OLControlCreditsComponent } from '@lib/ol/ol-control-credits';
import { OLControlGraticuleComponent } from '@lib/ol/ol-control-graticule';
import { OLControlLegendComponent } from '@lib/ol/ol-control-legend';
import { OLControlMousePositionComponent } from '@lib/ol/ol-control-mouseposition';
import { OLControlPrintComponent } from '@lib/ol/ol-control-print';
import { OLControlPrintProgressComponent } from '@lib/ol/ol-control-printprogress';
import { OLControlScaleLineComponent } from '@lib/ol/ol-control-scaleline';
import { OLControlSearchParcelsComponent } from '@lib/ol/ol-control-searchparcels';
import { OLControlZoomComponent } from '@lib/ol/ol-control-zoom';
import { OLControlZoomToExtentComponent } from '@lib/ol/ol-control-zoom2extent';
import { OLFilterCrop2BoundaryComponent } from '@lib/ol/ol-filter-crop2boundary';
import { OLFilterCrop2SelectedComponent } from '@lib/ol/ol-filter-crop2selected';
import { OLFilterEnhanceComponent } from '@lib/ol/ol-filter-enhance';
import { OLFilterGrayscaleComponent } from '@lib/ol/ol-filter-grayscale';
import { OLFilterPencilComponent } from '@lib/ol/ol-filter-pencil';
import { OLInteractionBoundaryComponent } from '@lib/ol/ol-interaction-boundary';
import { OLInteractionRedrawComponent } from '@lib/ol/ol-interaction-redraw';
import { OLInteractionSelectComponent } from '@lib/ol/ol-interaction-select';
import { OLLayerMapboxComponent } from '@lib/ol/ol-layer-mapbox';
import { OLLayerTileComponent } from '@lib/ol/ol-layer-tile';
import { OLLayerVectorComponent } from '@lib/ol/ol-layer-vector';
import { OLLayerVectorTileComponent } from '@lib/ol/ol-layer-vectortile';
import { OLMapComponent } from '@lib/ol/ol-map';
import { OLOverlayLabelComponent } from '@lib/ol/ol-overlay-label';
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
import { USE_EMULATOR as USE_AUTH_EMULATOR } from '@angular/fire/auth';
import { USE_EMULATOR as USE_FIRESTORE_EMULATOR } from '@angular/fire/firestore';
import { VersionDialogComponent } from '@lib/components/version-dialog';
import { ViewState } from '@lib/state/view';
import { WorkgroupValidator } from '@lib/validators/workgroup';

import { environment } from '@lib/environment';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import { faCrosshairs } from '@fortawesome/free-solid-svg-icons';
import { faDrawPolygon } from '@fortawesome/free-solid-svg-icons';
import { faExclamationTriangle } from '@fortawesome/pro-duotone-svg-icons';
import { faExpandArrows } from '@fortawesome/pro-solid-svg-icons';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { faLayerGroup } from '@fortawesome/pro-duotone-svg-icons';
import { faLayerPlus } from '@fortawesome/pro-duotone-svg-icons';
import { faObjectGroup as fadObjectGroup } from '@fortawesome/pro-duotone-svg-icons';
import { faObjectGroup as fasObjectGroup } from '@fortawesome/free-solid-svg-icons';
import { faObjectUngroup as fadObjectUngroup } from '@fortawesome/pro-duotone-svg-icons';
import { faObjectUngroup as fasObjectUngroup } from '@fortawesome/free-solid-svg-icons';
import { faPlusSquare as fadPlusSquare } from '@fortawesome/pro-duotone-svg-icons';
import { faPlusSquare as fasPlusSquare } from '@fortawesome/free-solid-svg-icons';
import { faPrint } from '@fortawesome/free-solid-svg-icons';
import { faQuestionCircle } from '@fortawesome/free-solid-svg-icons';
import { faRedo } from '@fortawesome/pro-duotone-svg-icons';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import { faSync } from '@fortawesome/pro-duotone-svg-icons';
import { faTasks as fadTasks } from '@fortawesome/pro-duotone-svg-icons';
import { faTasks as fasTasks } from '@fortawesome/free-solid-svg-icons';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { faUndo } from '@fortawesome/pro-duotone-svg-icons';
import { initializeAppProvider } from '@lib/services/initializer';
import { redirectLoggedInTo } from '@angular/fire/auth-guard';
import { redirectUnauthorizedTo } from '@angular/fire/auth-guard';

const COMPONENTS = [
  AddParcelComponent,
  BuilderComponent,
  ConfirmDialogComponent,
  MergeParcelsComponent,
  MessageDialogComponent,
  NavigatorComponent,
  OLAttributionComponent,
  OLControlAttributionComponent,
  OLControlCreditsComponent,
  OLControlGraticuleComponent,
  OLControlLegendComponent,
  OLControlMousePositionComponent,
  OLControlPrintComponent,
  OLControlPrintProgressComponent,
  OLControlScaleLineComponent,
  OLControlSearchParcelsComponent,
  OLControlZoomComponent,
  OLControlZoomToExtentComponent,
  OLFilterCrop2BoundaryComponent,
  OLFilterCrop2SelectedComponent,
  OLFilterEnhanceComponent,
  OLFilterGrayscaleComponent,
  OLFilterPencilComponent,
  OLInteractionBoundaryComponent,
  OLInteractionRedrawComponent,
  OLInteractionSelectComponent,
  OLLayerMapboxComponent,
  OLLayerTileComponent,
  OLLayerVectorComponent,
  OLLayerVectorTileComponent,
  OLMapComponent,
  OLOverlayLabelComponent,
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
  OLStylePeatlandComponent,
  OLStylePlacesComponent,
  OLStylePolygonsComponent,
  OLStylePowerlinesComponent,
  OLStyleRiversComponent,
  OLStyleRoadsComponent,
  OLStyleStoneWallsComponent,
  OLStyleTrailsComponent,
  OLStyleWetlandComponent,
  ParcelIDValidator,
  ParcelPropertiesComponent,
  ProfileComponent,
  PropertiesComponent,
  SubdivideParcelComponent,
  SubdivisionIDValidator,
  VersionDialogComponent
];

const DIRECTIVES = [ContextMenuHostDirective, WorkgroupValidator];

const PAGES = [LoginPage, CreatePage, ParcelsPage, RootPage];

const redirectUnauthorizedToLogin = (): AuthPipe =>
  redirectUnauthorizedTo(['login']);
const redirectLoggedInToMaps = (): AuthPipe => redirectLoggedInTo(['create']);

const ROUTES = [
  {
    path: 'login',
    component: LoginPage,
    canActivate: [AngularFireAuthGuard],
    data: { authGuardPipe: redirectLoggedInToMaps, state: 'login' }
  },
  {
    path: '',
    canActivate: [AngularFireAuthGuard],
    data: { authGuardPipe: redirectUnauthorizedToLogin },
    resolve: {
      index: IndexResolver,
      ready: ReadyResolver
    },
    children: [
      {
        path: 'create',
        component: CreatePage,
        data: { state: 'create' }
      },
      {
        path: 'parcels/:id',
        component: ParcelsPage,
        data: { state: 'parcels' }
      },
      { path: '', redirectTo: '/login', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: '/login', pathMatch: 'full' }
];

const STATES = [AuthState, MapState, OverlayState, ParcelsState, ViewState];
const STATES_SAVED = [OverlayState, RouterState, ViewState];

@NgModule({
  bootstrap: [RootPage],

  declarations: [...COMPONENTS, ...DIRECTIVES, ...PAGES],

  entryComponents: [],

  imports: [
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireAuthModule,
    AvatarModule,
    BrowserAnimationsModule,
    BrowserModule,
    CommonModule,
    DragDropModule,
    FirebaseUIModule.forRoot(environment.auth),
    FontAwesomeModule,
    FormsModule,
    HttpClientModule,
    MatButtonModule,
    MatCardModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatMenuModule,
    MatProgressBarModule,
    MatRadioModule,
    MatSelectModule,
    MatSidenavModule,
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
      faCrosshairs,
      faDrawPolygon,
      faExclamationTriangle,
      faExpandArrows,
      faInfoCircle,
      faLayerGroup,
      faLayerPlus,
      fadObjectGroup,
      fasObjectGroup,
      fadObjectUngroup,
      fasObjectUngroup,
      fadPlusSquare,
      fasPlusSquare,
      faPrint,
      faQuestionCircle,
      faRedo,
      faSearch,
      faSync,
      fadTasks,
      fasTasks,
      faTimes,
      faUndo
    );
  }
}
