import { GeoJSONFilter } from './geojson';
import { ProxyServer } from './proxy';

import { Compressor } from 'serverx-ts';
import { CORS } from 'serverx-ts';
import { FILE_SERVER_OPTS } from 'serverx-ts';
import { FileServer } from 'serverx-ts';
import { HttpApp } from 'serverx-ts';
import { REQUEST_LOGGER_OPTS } from 'serverx-ts';
import { RequestLogger } from 'serverx-ts';
import { Route } from 'serverx-ts';

import { createServer } from 'http';

import chalk from 'chalk';

const fileServerOpts = {
  provide: FILE_SERVER_OPTS,
  useValue: { root: __dirname }
};

const loggerOpts = {
  provide: REQUEST_LOGGER_OPTS,
  useValue: { format: 'tiny' }
};

const routes: Route[] = [
  {
    path: '/proxy',
    methods: ['GET'],
    handler: ProxyServer,
    middlewares: [Compressor, CORS, RequestLogger],
    services: [loggerOpts]
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

const app = new HttpApp(routes);

const listener = app.listen();
const server = createServer(listener).on('listening', () => {
  console.log(
    chalk.blue(`NH GIS listening on port 4201 deploying from ${__dirname}`)
  );
});

server.listen(4201);
