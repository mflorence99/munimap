import { Injectable } from '@angular/core';

// 👉 all intervals in milliseconds

@Injectable({ providedIn: 'root' })
export class Params {
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
