import { orderBy, groupBy } from 'lodash';

export default function navigationHelper({ pages, ignorePaths }) {
  const filteredPages = pages.filter(page => !!page.group).filter(page => page.outputPath.endsWith('/index.html'));

  const orderedPages = orderBy(filteredPages, 'sortOrder');
  const groupedPages = groupBy(orderedPages, 'group');

  const groups = Object.keys(groupedPages).map(groupTitle => ({
    title: groupTitle,
    items: groupedPages[groupTitle].map(page => ({
      text: page.title,
      url: page.url
    }))
  }));

  return groups;
}
