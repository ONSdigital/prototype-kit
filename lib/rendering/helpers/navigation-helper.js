import lodash from 'lodash';

export default function navigationHelper({ pages, pageInfo, type }) {
  pages = lodash.orderBy(pages, 'sortOrder');

  if (type) {
    if (type === 'main') {
      pages = pages.filter(page => page.depth === 3);
    }

    if (type === 'secondary') {
      const parent = pageInfo.depth === 5 ? pageInfo.parent.parent : pageInfo.parent;
      pages = parent.children.filter(page => !!page.templatePath);
    }
  }

  return pages;
}
