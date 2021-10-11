import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class Params {
  esri = {
    // 👇 don't panic! domain protected
    apiKey:
      'AAPKae64696be2e34f6aac7bced46726f427ZCnEEvKPioJi8X0wsYXk0P2I5q1lmQFG5xHmzbj-C4HavKlxv5n7N178jyum_SBh'
  };

  geoJSON = {
    // 👉 TODO: chanmge depending on environment
    host: 'http://localhost:4201'
  };

  google = {
    // 👇 don't panic! domain protected
    apiKey: 'AIzaSyCAYavpwIUZOayj72XA3AZYJeYjlVscqvk'
  };

  mapbox = {
    // 👇 don't panic! domain protected
    apiKey:
      'sk.eyJ1IjoibWZsbzk5OSIsImEiOiJja3VmbGFrZmUxdmxhMnFxcDc0YzFoMHB4In0.nzf2uxMbBt5J2KVvjIRbnA'
  };
}
