const PROXY_CONFIG = [
  {
    changeOrigin: true,
    context: ['/stonewalls'],
    logLevel: 'debug',
    pathRewrite: (path, req) => path.replace('/stonewalls', ''),
    target: 'https://services1.arcgis.com',
    secure: true
  }
];

module.exports = PROXY_CONFIG;
