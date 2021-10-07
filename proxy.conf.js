const PROXY_CONFIG = [
  {
    changeOrigin: true,
    context: ['/street/arcgis'],
    pathRewrite: (path, req) =>
      reverseXY(path).replace('/street/arcgis', '/tile'),
    target:
      'https://services.arcgisonline.com/arcgis/rest/services/World_Street_Map/MapServer',
    secure: true
  },
  {
    changeOrigin: true,
    context: ['/street/osm'],
    logLevel: 'debug',
    pathRewrite: (path, req) => path.replace('/street/osm', '') + '.png',
    target: 'https://tile.openstreetmap.org',
    secure: true
  },
  {
    changeOrigin: true,
    context: ['/topo/arcgis'],
    logLevel: 'debug',
    pathRewrite: (path, req) =>
      reverseXY(path).replace('/topo/arcgis', '/tile'),
    target:
      'https://services.arcgisonline.com/arcgis/rest/services/Elevation/World_Hillshade/MapServer',
    secure: true
  }
];

const reverseXY = (path) => {
  const [y, x, ...rest] = path.substring(1).split('/').reverse();
  const reversed = [...rest.reverse(), y, x].join('/');
  return `/${reversed}`;
};

module.exports = PROXY_CONFIG;
