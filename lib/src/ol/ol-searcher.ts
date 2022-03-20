import { Injectable } from '@angular/core';

// 👇 https://sambleckley.com/writing/angular-mixed-type-contentchildren-that-share-an-interface.html

export interface Searcher {}

@Injectable()
export class SearcherComponent {}
