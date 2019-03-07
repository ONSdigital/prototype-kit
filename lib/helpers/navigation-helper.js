import { orderBy } from 'lodash';

export function navigationHelper({ pages, ignoreURLs, devMode }) {
  if (ignoreURLs) {
    pages = pages.filter(page => !ignoreURLs.includes(page.url));
  }

  pages = orderBy(pages, 'sortOrder').map(page => ({
    ...page,
    url: devMode && page.url !== '/' ? page.url += '.html' : page.url
  }));

  return pages;
}
