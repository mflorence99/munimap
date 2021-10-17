export interface Map {
  id: string;
  name: string;
  path: string;
  style: 'arcgis' | 'google' | 'mapbox' | 'osm' | 'blank';
}
