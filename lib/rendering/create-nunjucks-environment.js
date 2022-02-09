import nunjucks from 'nunjucks';

import setAttribute from './filters/set-attribute.js';
import setAttributes from './filters/set-attributes.js';

export default function createNunjucksEnvironment(loader, designSystemVersion = 'latest') {
  const dsVersionDirectory = designSystemVersion === 'latest' ? '' : `/${designSystemVersion}`;
  const templatePaths = ['src', 'src/prototypes', `node_modules/@ons/design-system${dsVersionDirectory}`];
  const nunjucksLoader = loader ?? new nunjucks.FileSystemLoader(templatePaths, { noCache: true });

  const nunjucksEnvironment = new nunjucks.Environment(nunjucksLoader);

  nunjucksEnvironment.addFilter('setAttribute', setAttribute);
  nunjucksEnvironment.addFilter('setAttributes', setAttributes);

  return nunjucksEnvironment;
}
