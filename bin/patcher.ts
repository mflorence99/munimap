import { copyFileSync } from 'fs';

import chalk from 'chalk';
import recursive from 'recursive-readdir';

recursive('./patches', (err, files) => {
  if (err) console.log(chalk.red(err.message));
  files.forEach((src) => {
    const dest = src.replace(/^patches/, 'node_modules');
    console.log(`Copying ${chalk.yellow(src)} to ${chalk.blue(dest)}`);
    copyFileSync(src, dest);
  });
});
