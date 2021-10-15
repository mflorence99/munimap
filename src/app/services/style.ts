import { Params } from './params';

import { Injectable } from '@angular/core';
import { StyleFunction as OLStyleFunction } from 'ol/style/Style';

import OLFeature from 'ol/Feature';
import OLFill from 'ol/style/Fill';
import OLStroke from 'ol/style/Stroke';
import OLStyle from 'ol/style/Style';
import OLText from 'ol/style/Text';

@Injectable({ providedIn: 'root' })
export class StyleService {
  #var: Record<string, string> = {};

  constructor(private params: Params) {
    const style = getComputedStyle(document.documentElement);
    const names = this.#findAllVariables();
    this.#var = names.reduce((acc, name) => {
      acc[name] = style.getPropertyValue(name).trim();
      return acc;
    }, {});
  }

  // 👉 https://stackoverflow.com/questions/48760274
  #findAllVariables(): string[] {
    return Array.from(document.styleSheets)
      .filter(
        (sheet) =>
          sheet.href === null || sheet.href.startsWith(window.location.origin)
      )
      .reduce(
        (acc, sheet) =>
          (acc = [
            ...acc,
            ...Array.from(sheet.cssRules).reduce(
              (def, rule: any) =>
                (def =
                  rule.selectorText === ':root'
                    ? [
                        ...def,
                        ...Array.from(rule.style).filter((name: any) =>
                          name.startsWith('--map')
                        )
                      ]
                    : def),
              []
            )
          ]),
        []
      );
  }

  featureOutline(): OLStyleFunction {
    const stroke = this.#var['--map-feature-outline'];
    const width = +this.#var['--map-feature-outline-width'];
    return (): OLStyle => {
      return new OLStyle({
        fill: new OLFill({ color: [0, 0, 0, 0] }),
        stroke: new OLStroke({ color: stroke, width })
      });
    };
  }

  featureSelect(): OLStyleFunction {
    const color = this.#var['--map-feature-text-color'];
    const fill = this.#var['--map-feature-fill'];
    const font = this.#var['--map-feature-text-font'];
    const stroke = this.#var['--map-feature-outline'];
    const width = +this.#var['--map-feature-outline-width'];
    return (feature: OLFeature<any>): OLStyle => {
      return new OLStyle({
        fill: new OLFill({ color: fill }),
        stroke: new OLStroke({ color: stroke, width }),
        text: new OLText({
          font,
          fill: new OLFill({ color }),
          placement: 'point',
          text: feature.getId() as string
        })
      });
    };
  }
}
