import _import from 'eslint-plugin-import';
import importSplitnsort from 'eslint-plugin-import-splitnsort';
import preferArrow from 'eslint-plugin-prefer-arrow';
import prettier from 'eslint-plugin-prettier';
import { fixupPluginRules } from '@eslint/compat';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all
});

export default [
  ...compat.extends('eslint-config-mflorence99', 'eslint-config-prettier'),
  {
    ignores: ['**/*.mjs'],

    plugins: {
      'import': fixupPluginRules(_import),
      'import-splitnsort': importSplitnsort,
      'prefer-arrow': preferArrow,
      prettier
    },

    languageOptions: {
      ecmaVersion: 5,
      sourceType: 'script',

      parserOptions: {
        project: [
          'author/src/tsconfig.json',
          'bin/tsconfig.json',
          'proxy/src/tsconfig.json',
          'viewer/src/tsconfig.json',
          'worker/src/tsconfig.json'
        ]
      }
    },

    rules: {
      '@typescript-eslint/ban-ts-comment': 'off',

      '@typescript-eslint/naming-convention': [
        'error',
        {
          format: ['camelCase', 'UPPER_CASE', 'snake_case', 'PascalCase'],
          leadingUnderscore: 'allow',
          selector: 'default'
        },
        {
          format: null,
          modifiers: ['requiresQuotes'],
          selector: 'property'
        },
        {
          format: ['PascalCase'],
          selector: 'typeLike'
        }
      ],

      '@typescript-eslint/no-misused-promises': [
        'error',
        {
          checksVoidReturn: false
        }
      ],

      '@typescript-eslint/no-duplicate-type-constituents': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-namespace': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
      '@typescript-eslint/unbound-method': 'off',

      'no-constant-condition': [
        'error',
        {
          checkLoops: false
        }
      ],

      'no-unused-private-class-members': 'error'
    }
  }
];
