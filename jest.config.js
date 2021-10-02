module.exports = {
  collectCoverage: true,
  collectCoverageFrom: ['./src/app/**/*.ts', '!./src/app/module.ts'],
  coverageReporters: ['json-summary', 'text', 'html'],
  globals: {
    'ts-jest': {
      tsconfig: './tests/tsconfig.json'
    }
  },
  preset: 'jest-preset-angular',
  reporters: [
    'default',
    ['jest-junit', { outputDirectory: './reports/junit' }]
  ],
  roots: ['./bin/', './src/', './tests/'],
  setupFilesAfterEnv: ['jest-extended', 'jest-preset-angular'],
  testMatch: ['**/+(*.)+(spec).+(ts)'],
  testResultsProcessor: 'jest-junit',
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },
  transformIgnorePatterns: ['^.+\\.js$']
};
