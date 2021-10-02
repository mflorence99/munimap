import { Inject } from '@angular/core';
import { Injectable } from '@angular/core';
import { InjectionToken } from '@angular/core';
import { ModuleWithProviders } from '@angular/core';
import { NgModule } from '@angular/core';
import { NGXS_PLUGINS } from '@ngxs/store';
import { NgxsPlugin } from '@ngxs/store';

import { tap } from 'rxjs/operators';

// 👇 we're never going to use LogRocket as it's too expensive
//    for this vanity project -- but it made us think about NGXS plugins
//    and even though this logger is a super hack, I like the output better

// const reduxMiddleware = LogRocket.reduxMiddleware({});

// 👀  https://www.ngxs.io/plugins/intro

export const LOGROCKET_PLUGIN_OPTIONS = new InjectionToken(
  'LOGROCKET_PLUGIN_OPTIONS'
);

@Injectable()
export class LogRocketPlugin implements NgxsPlugin {
  constructor(@Inject(LOGROCKET_PLUGIN_OPTIONS) private options: any) {}

  // 👇 these colors hacked to look OK in dark mode

  handle(state: any, action: any, next: any): any {
    // 👇 action is of class NgxsDataAction, which isn't a real
    //    exported class for some reason
    // 👀  https://github.com/ngxs-labs/data/blob/5e8706bc43d671b05d227d05118ea0aaa821d769/lib/internals/src/utils/action/dynamic-action.ts
    const key = Object.keys(action)[0] ?? action.constructor.name;
    const payload = action[key];

    // start logging group with old state
    console.group(key);
    if (payload) console.log(`%cpayload`, 'color: hotpink', payload);
    console.log('%cold', 'color: darkkhaki', state);

    // ... now we have the new state
    return next(state, action).pipe(
      tap((result) => {
        console.log('%cnew', 'color: skyblue', result);
        console.groupEnd();

        // call LogRocket
        // reduxMiddleware({ getState: () => state })(() => result)(key);
      })
    );
  }
}

@NgModule()
export class LogRocketPluginModule {
  static forRoot(config?: any): ModuleWithProviders<any> {
    return {
      ngModule: LogRocketPluginModule,
      providers: [
        {
          provide: NGXS_PLUGINS,
          useClass: LogRocketPlugin,
          multi: true
        },
        {
          provide: LOGROCKET_PLUGIN_OPTIONS,
          useValue: config
        }
      ]
    };
  }
}
