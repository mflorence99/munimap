export abstract class OLStylerService {
  var: Record<string, string> = {};

  constructor() {
    const style = getComputedStyle(document.documentElement);
    const names = this.#findAllVariables();
    this.var = names.reduce((acc, name) => {
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
}
