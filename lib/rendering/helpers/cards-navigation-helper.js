import lodash from 'lodash';

export default function cardsNavigationHelper({ pages }) {
  pages = lodash.orderBy(pages, 'sortOrder');
  return pages;
}
