import { GEO_SERVER_OPTS } from "./geoserver";
import { GeoServer } from "./geoserver";
import { PROXY_SERVER_OPTS } from "./proxy";
import { ProxyServer } from "./proxy";

import * as yargs from "yargs";

import { AWSLambdaApp } from "serverx-ts";
import { BinaryTyper } from "serverx-ts";
import { Compressor } from "serverx-ts";
import { CORS } from "serverx-ts";
import { FILE_SERVER_OPTS } from "serverx-ts";
import { FileServer } from "serverx-ts";
import { HttpApp } from "serverx-ts";
import { REQUEST_LOGGER_OPTS } from "serverx-ts";
import { RequestLogger } from "serverx-ts";
import { Route } from "serverx-ts";

import { createServer } from "http";
import { join } from "path";

import chalk from "chalk";

const argv = yargs
  .usage("node .../server.js [options]")
  .alias("p", "port")
  .describe("p", "Port used by proxy in test mode")
  .alias("d", "dir")
  .describe("d", "Directory containing GeoJSON files")
  .help(false)
  .version(false)
  .epilog("MuniMap proxy & GeoJSON server").argv;

// 👇 default directory b/c it won't be so convenient to
//    specify it when serverless

const isDev = argv["port"];

const dir = argv["dir"] ?? isDev ? "./data" : "/mnt/efs/MuniMap/proxy";

// 👇 we cache bust geojson requests with the caller's version number
//    so we can effectively cache this data forever -- as long as we deploy
//    a new client version whenever we change it

const fileServerOpts = {
  provide: FILE_SERVER_OPTS,
  useValue: { maxAge: 365 * 24 * 60 * 60 /* 👈 1 year */, root: dir },
};

const geoServerOpts = {
  provide: GEO_SERVER_OPTS,
  useValue: { maxAge: 365 * 24 * 60 * 60 /* 👈 1 year */, root: dir },
};

const loggerOpts = {
  provide: REQUEST_LOGGER_OPTS,
  useValue: { format: "tiny" },
};

// 👇 the proxy serves hillshade, satellite view etc which changes
//    infrequently, so we can make maxAge quite long

const proxyServerOpts = {
  provide: PROXY_SERVER_OPTS,
  useValue: {
    maxAge: 45 * 24 * 60 * 60 /* 👈 45 days */,
    root: join(dir, "cache"),
  },
};

const routes: Route[] = [
  {
    path: "/proxy",
    methods: ["GET"],
    handler: ProxyServer,
    middlewares: isDev ? [BinaryTyper, Compressor, CORS] : [BinaryTyper, CORS],
    services: [proxyServerOpts],
  },
  {
    path: "/NEW HAMPSHIRE",
    methods: ["GET"],
    handler: GeoServer,
    middlewares: isDev ? [Compressor, CORS] : [CORS],
    services: [loggerOpts, geoServerOpts],
  },
  {
    path: "/",
    methods: ["GET"],
    handler: FileServer,
    middlewares: isDev
      ? [Compressor, CORS, RequestLogger]
      : [CORS, RequestLogger],
    services: [loggerOpts, fileServerOpts],
  },
  {
    path: "/",
    methods: ["OPTIONS"],
    middlewares: [CORS],
  },
];

let app;

// 👉 if port specified, we're in local test mode

if (isDev) {
  app = new HttpApp(routes);

  const listener = app.listen();
  const server = createServer(listener).on("listening", () => {
    console.log(
      chalk.blue(
        `MuniMap proxy listening on port ${argv["port"]} deploying from ${dir}`,
      ),
    );
  });

  server.listen(Number(argv["port"]));
}

// 👉 if no port specified, we're running serverless
else app = new AWSLambdaApp(routes);

export function aws(event, context): any {
  return app.handle(event, context);
}
