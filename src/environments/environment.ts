import BUILD from '../assets/build.json';
import PACKAGE from '../../package.json';

import { UAParser } from 'ua-parser-js';

export const environment = {
  build: {
    id: BUILD.id,
    date: BUILD.date
  },
  localhost: ['localhost', '127.0.0.1'].includes(location.hostname),
  package: {
    author: PACKAGE.author,
    name: PACKAGE.name,
    description: PACKAGE.description,
    license: PACKAGE.license,
    repository: {
      type: PACKAGE.repository.type,
      url: PACKAGE.repository.url
    },
    version: PACKAGE.version
  },
  production: false,
  ua: UAParser()
};
