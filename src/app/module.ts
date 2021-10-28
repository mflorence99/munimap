import { AuthState } from './state/auth';
import { HttpCache } from './services/http-cache';
import { IndexResolver } from './resolvers/index';
import { InitializerService } from './services/initializer';
import { LoginPage } from './pages/login';
import { MapCreatePage } from './pages/map-create';
import { MapFilterComponent } from './components/map-filter';
import { MapState } from './state/map';
import { OLAttributionComponent } from './ol/ol-attribution';
import { OLControlAttributionComponent } from './ol/ol-control-attribution';
import { OLControlMousePositionComponent } from './ol/ol-control-mouseposition';
import { OLControlScaleLineComponent } from './ol/ol-control-scaleline';
import { OLControlSearchParcelsComponent } from './ol/ol-control-searchparcels';
import { OLControlZoomComponent } from './ol/ol-control-zoom';
import { OLControlZoomToExtentComponent } from './ol/ol-control-zoom2extent';
import { OLFilterCrop2BoundaryComponent } from './ol/ol-filter-crop2boundary';
import { OLFilterEnhanceComponent } from './ol/ol-filter-enhance';
import { OLFilterGrayscaleComponent } from './ol/ol-filter-grayscale';
import { OLFilterPencilComponent } from './ol/ol-filter-pencil';
import { OLInteractionSelectComponent } from './ol/ol-interaction-select';
import { OLLayerImageComponent } from './ol/ol-layer-image';
import { OLLayerMapboxComponent } from './ol/ol-layer-mapbox';
import { OLLayerTileComponent } from './ol/ol-layer-tile';
import { OLLayerVectorComponent } from './ol/ol-layer-vector';
import { OLLayerVectorTileComponent } from './ol/ol-layer-vectortile';
import { OLMapComponent } from './ol/ol-map';
import { OLSourceBoundaryComponent } from './ol/ol-source-boundary';
import { OLSourceGeoJSONComponent } from './ol/ol-source-geojson';
import { OLSourceOSMComponent } from './ol/ol-source-osm';
import { OLSourceStaticComponent } from './ol/ol-source-static';
import { OLSourceStoneWallsComponent } from './ol/ol-source-stonewalls';
import { OLSourceXYZComponent } from './ol/ol-source-xyz';
import { OLStyleBoundaryComponent } from './ol/ol-style-boundary';
import { OLStyleBuildingsComponent } from './ol/ol-style-buildings';
import { OLStyleLakesComponent } from './ol/ol-style-lakes';
import { OLStyleParcelsComponent } from './ol/ol-style-parcels';
import { OLStylePatternDirective } from './ol/ol-style-pattern';
import { OLStylePlacesComponent } from './ol/ol-style-places';
import { OLStylePolygonsComponent } from './ol/ol-style-polygons';
import { OLStylePowerlinesComponent } from './ol/ol-style-powerlines';
import { OLStyleRiversComponent } from './ol/ol-style-rivers';
import { OLStyleRoadsComponent } from './ol/ol-style-roads';
import { OLStyleStoneWallsComponent } from './ol/ol-style-stonewalls';
import { OLStyleTrailsComponent } from './ol/ol-style-trails';
import { ReadyResolver } from './resolvers/ready';
import { RootPage } from './root';
import { TownMapPage } from './pages/town-map';
import { TownMapSetupComponent } from './components/town-map-setup';
import { UserProfileComponent } from './components/user-profile';
import { ViewState } from './state/view';

import { environment } from '../environment';
import { initializeAppProvider } from './services/initializer';

import * as Sentry from '@sentry/angular';

import { AngularFireAuthGuard } from '@angular/fire/auth-guard';
import { AngularFireAuthModule } from '@angular/fire/auth';
import { AngularFireModule } from '@angular/fire';
import { APP_INITIALIZER } from '@angular/core';
import { AuthPipe } from '@angular/fire/auth-guard';
import { AvatarModule } from 'ngx-avatar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { DecimalPipe } from '@angular/common';
import { ErrorHandler } from '@angular/core';
import { FirebaseUIModule } from 'firebaseui-angular';
import { FormsModule } from '@angular/forms';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { HttpClientModule } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { NgModule } from '@angular/core';
import { NgObjectPipesModule } from 'ngx-pipes';
import { NgxsLoggerPluginModule } from '@ngxs/logger-plugin';
import { NgxsModule } from '@ngxs/store';
import { NgxsReduxDevtoolsPluginModule } from '@ngxs/devtools-plugin';
import { NgxsRouterPluginModule } from '@ngxs/router-plugin';
import { NgxsStoragePluginModule } from '@ngxs/storage-plugin';
import { OverlayModule } from '@angular/cdk/overlay';
import { RouterModule } from '@angular/router';
import { RouterState } from '@ngxs/router-plugin';
import { USE_EMULATOR as USE_AUTH_EMULATOR } from '@angular/fire/auth';
import { USE_EMULATOR as USE_FIRESTORE_EMULATOR } from '@angular/fire/firestore';

import { redirectLoggedInTo } from '@angular/fire/auth-guard';
import { redirectUnauthorizedTo } from '@angular/fire/auth-guard';

const COMPONENTS = [
  MapFilterComponent,
  OLAttributionComponent,
  OLControlAttributionComponent,
  OLControlMousePositionComponent,
  OLControlScaleLineComponent,
  OLControlSearchParcelsComponent,
  OLControlZoomComponent,
  OLControlZoomToExtentComponent,
  OLFilterCrop2BoundaryComponent,
  OLFilterEnhanceComponent,
  OLFilterGrayscaleComponent,
  OLFilterPencilComponent,
  OLInteractionSelectComponent,
  OLLayerImageComponent,
  OLLayerMapboxComponent,
  OLLayerTileComponent,
  OLLayerVectorComponent,
  OLLayerVectorTileComponent,
  OLMapComponent,
  OLSourceBoundaryComponent,
  OLSourceGeoJSONComponent,
  OLSourceOSMComponent,
  OLSourceStaticComponent,
  OLSourceStoneWallsComponent,
  OLSourceXYZComponent,
  OLStyleBoundaryComponent,
  OLStyleBuildingsComponent,
  OLStyleLakesComponent,
  OLStyleParcelsComponent,
  OLStylePatternDirective,
  OLStylePlacesComponent,
  OLStylePolygonsComponent,
  OLStylePowerlinesComponent,
  OLStyleRiversComponent,
  OLStyleRoadsComponent,
  OLStyleStoneWallsComponent,
  OLStyleTrailsComponent,
  TownMapSetupComponent,
  UserProfileComponent
];

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

const STATES = [AuthState, MapState, ViewState];
const STATES_SAVED = [RouterState, ViewState];

@NgModule({
  bootstrap: [RootPage],

  declarations: [...COMPONENTS, ...PAGES],

  entryComponents: [],

  imports: [
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireAuthModule,
    AvatarModule,
    BrowserAnimationsModule,
    BrowserModule,
    CommonModule,
    FirebaseUIModule.forRoot(environment.auth),
    FormsModule,
    HttpClientModule,
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatMenuModule,
    MatProgressBarModule,
    MatRadioModule,
    MatSelectModule,
    MatSidenavModule,
    MatToolbarModule,
    NgObjectPipesModule,
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
    RouterModule.forRoot(ROUTES)
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
export class RootModule {}
