import { join } from 'path';
import { readFileSync } from 'fs';
import { writeFileSync } from 'fs';

/* eslint-disable @typescript-eslint/naming-convention */
const coveragePath = join(__dirname, '..', 'coverage', 'coverage-summary.json');
const coverage = JSON.parse(readFileSync(coveragePath, { encoding: 'utf8' }));

const readmePath = join(__dirname, '..', 'README.md');
const readme_md = readFileSync(readmePath, { encoding: 'utf8' });

writeFileSync(
  readmePath,
  readme_md.replace(
    /coverage-[0-9.]+%25-blue/gm,
    `coverage-${coverage.total.statements.pct}%25-blue`
  )
);
