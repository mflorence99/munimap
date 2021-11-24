import { GeoJSONFilter } from './geojson';
import { PROXY_SERVER_OPTS } from './proxy';
import { ProxyServer } from './proxy';

import * as yargs from 'yargs';

import { Compressor } from 'serverx-ts';
import { CORS } from 'serverx-ts';
import { FILE_SERVER_OPTS } from 'serverx-ts';
import { FileServer } from 'serverx-ts';
import { HttpApp } from 'serverx-ts';
import { REQUEST_LOGGER_OPTS } from 'serverx-ts';
import { RequestLogger } from 'serverx-ts';
import { Route } from 'serverx-ts';

import { createServer } from 'http';
import { join } from 'path';

import chalk from 'chalk';

const argv = yargs
  .usage('node .../server.js [options]')
  .alias('p', 'port')
  .describe('p', 'Port used by proxy in test mode')
  .alias('d', 'dir')
  .describe('d', 'Directory containing GeoJSON files')
  .help(false)
  .version(false)
  .epilog('MuniMap proxy & GeoJSON server').argv;

// 👇 default directory b/c it won't be so convenient to
//    specify it when serverless

const dir = argv['dir'] ?? '/efs/MuniMap/proxy';

const fileServerOpts = {
  provide: FILE_SERVER_OPTS,
  useValue: { root: dir }
};

const loggerOpts = {
  provide: REQUEST_LOGGER_OPTS,
  useValue: { format: 'tiny' }
};

const proxyServerOpts = {
  provide: PROXY_SERVER_OPTS,
  useValue: { cache: join(dir, 'cache') }
};

const routes: Route[] = [
  {
    path: '/proxy',
    methods: ['GET'],
    handler: ProxyServer,
    middlewares: [Compressor, CORS, RequestLogger],
    services: [loggerOpts, proxyServerOpts]
  },
  {
    path: '/',
    methods: ['GET'],
    handler: FileServer,
    middlewares: [Compressor, GeoJSONFilter, CORS, RequestLogger],
    services: [loggerOpts, fileServerOpts]
  },
  {
    path: '/',
    methods: ['OPTIONS'],
    middlewares: [CORS, RequestLogger],
    services: [loggerOpts]
  }
];

// 🔥 if no port then go serverless

const app = new HttpApp(routes);

const listener = app.listen();
const server = createServer(listener).on('listening', () => {
  console.log(
    chalk.blue(
      `MuniMap proxy listening on port ${argv['port']} deploying from ${dir}`
    )
  );
});

server.listen(4201);
