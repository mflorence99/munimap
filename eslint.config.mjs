import myConfig from 'eslint-config-mflorence99';

export default [
  ...myConfig,
  {
    languageOptions: {
      parserOptions: {
        project: [
          'author/src/tsconfig.json',
          'proxy/src/tsconfig.json',
          'viewer/src/tsconfig.json',
          'worker/src/tsconfig.json'
        ]
      }
    },
    name: 'MuniMap projects'
  },
  {
    ignores: ['eslint.config.mjs', 'bin/**/*.ts'],
    name: 'MuniMap file exclusions'
  }
];
