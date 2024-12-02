import myConfig from 'eslint-config-mflorence99';

export default [
  ...myConfig,
  {
    ignores: ['**/*.mjs'],
    languageOptions: {
      parserOptions: {
        project: [
          'author/src/tsconfig.json',
          'bin/tsconfig.json',
          'proxy/src/tsconfig.json',
          'viewer/src/tsconfig.json',
          'worker/src/tsconfig.json'
        ]
      }
    }
  }
];
