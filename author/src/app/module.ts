import { ContextMenuHostDirective } from './contextmenu/contextmenu-host';
import { LoginPage } from './pages/login/login';
import { MapCreatePage } from './pages/map-create/map-create';
import { MapFilterComponent } from './pages/map-create/map-filter';
import { MergeParcelsComponent } from './contextmenu/merge-parcels';
import { ParcelPropertiesComponent } from './contextmenu/parcel-properties';
import { RootPage } from './pages/root/root';
import { SubdivideParcelComponent } from './contextmenu/subdivide-parcel';
import { TownMapPage } from './pages/town-map/town-map';
import { TownMapSetupComponent } from './pages/town-map/town-map-setup';
import { UserProfileComponent } from './pages/root/user-profile';
import { WorkgroupValidator } from './pages/root/workgroup-validator';

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
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { HttpCache } from '@lib/services/http-cache';
import { HttpClientModule } from '@angular/common/http';
import { IndexResolver } from '@lib/resolvers/index';
import { InitializerService } from '@lib/services/initializer';
import { LocationStrategy } from '@angular/common';
import { MapState } from '@lib/state/map';
import { MatButtonModule } from '@angular/material/button';
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
import { MatToolbarModule } from '@angular/material/toolbar';
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
import { ParcelsState } from '@lib/state/parcels';
import { PathLocationStrategy } from '@angular/common';
import { ReadyResolver } from '@lib/resolvers/ready';
import { RouterModule } from '@angular/router';
import { RouterState } from '@ngxs/router-plugin';
import { USE_EMULATOR as USE_AUTH_EMULATOR } from '@angular/fire/auth';
import { USE_EMULATOR as USE_FIRESTORE_EMULATOR } from '@angular/fire/firestore';
import { ViewState } from '@lib/state/view';

import { environment } from '@lib/environment';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import { faCog } from '@fortawesome/free-solid-svg-icons';
import { faCrosshairs as fadCrosshairs } from '@fortawesome/pro-duotone-svg-icons';
import { faCrosshairs as fasCrosshairs } from '@fortawesome/free-solid-svg-icons';
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
import { faPrint } from '@fortawesome/free-solid-svg-icons';
import { faRedo } from '@fortawesome/pro-duotone-svg-icons';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import { faTasks as fadTasks } from '@fortawesome/pro-duotone-svg-icons';
import { faTasks as fasTasks } from '@fortawesome/free-solid-svg-icons';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { faUndo } from '@fortawesome/pro-duotone-svg-icons';
import { initializeAppProvider } from '@lib/services/initializer';
import { redirectLoggedInTo } from '@angular/fire/auth-guard';
import { redirectUnauthorizedTo } from '@angular/fire/auth-guard';

const COMPONENTS = [
  ConfirmDialogComponent,
  MapFilterComponent,
  MergeParcelsComponent,
  MessageDialogComponent,
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
  ParcelPropertiesComponent,
  SubdivideParcelComponent,
  TownMapSetupComponent,
  UserProfileComponent
];

const DIRECTIVES = [ContextMenuHostDirective, WorkgroupValidator];

const PAGES = [LoginPage, MapCreatePage, RootPage, TownMapPage];

const redirectUnauthorizedToLogin = (): AuthPipe =>
  redirectUnauthorizedTo(['login']);
const redirectLoggedInToMaps = (): AuthPipe =>
  redirectLoggedInTo(['map-create']);

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
        path: 'map-create',
        component: MapCreatePage,
        data: { state: 'map-create' }
      },
      {
        path: 'town-map/:id',
        component: TownMapPage,
        data: { state: 'town-map' }
      },
      { path: '', redirectTo: '/login', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: '/login', pathMatch: 'full' }
];

const STATES = [AuthState, MapState, ParcelsState, ViewState];
const STATES_SAVED = [RouterState, ViewState];

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
    MatCheckboxModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatMenuModule,
    MatProgressBarModule,
    MatRadioModule,
    MatSelectModule,
    MatSidenavModule,
    MatToolbarModule,
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
    RouterModule.forRoot(ROUTES, { onSameUrlNavigation: 'reload' })
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
        showDialog: true
      })
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HttpCache,
      multi: true
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
      faCog,
      fadCrosshairs,
      fasCrosshairs,
      faDrawPolygon,
      faExclamationTriangle,
      faExpandArrows,
      faInfoCircle,
      faLayerGroup,
      faLayerPlus,
      fadObjectGroup,
      fasObjectGroup,
      fasObjectUngroup,
      fadObjectUngroup,
      faPrint,
      faRedo,
      faSearch,
      fadTasks,
      fasTasks,
      faTimes,
      faUndo
    );
  }
}
