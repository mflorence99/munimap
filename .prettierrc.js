module.exports = {
  arrowParens: 'always',
  bracketSameLine: true,
  bracketSpacing: true,
  cssDeclarationSorterOrder: 'alphabetical',
  endOfLine: 'lf',
  htmlWhitespaceSensitivity: 'ignore',
  printWidth: 80,
  plugins: ['prettier-plugin-css-order', 'prettier-plugin-package'],
  proseWrap: 'never',
  overrides: [
    {
      files: '*.html',
      options: {
        parser: 'angular'
      }
    }
  ],
  quoteProps: 'consistent',
  semi: true,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'none',
  useTabs: false
};
