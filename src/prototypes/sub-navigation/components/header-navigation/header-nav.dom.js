import domready from '../../../../helpers/domready.js';
domready(async () => {
  const toggleMainBtn = document.querySelector('.proto-ons-js-toggle-main');
  const navEl = document.querySelector('.proto-ons-js-header-nav');
  const toggleSecondaryBtn = document.querySelector('.proto-ons-js-toggle-secondary');
  const secondaryNavEl = document.querySelector('.proto-ons-js-secondary-nav');
  const navHideClass = 'ons-u-d-no@xxs@m';
  const secondaryNavHideClass = 'ons-u-d-no';
  const toggleSearchBtn = document.querySelector('.proto-ons-js-toggle-search');
  const searchEl = document.querySelector('.proto-ons-js-header-search');
  const searchHideClass = 'ons-u-d-no@xs@m';

  if (toggleSecondaryBtn) {
    const secondaryNavToggle = (await import('./header-nav')).default;

    new secondaryNavToggle(toggleSecondaryBtn, secondaryNavEl, secondaryNavHideClass).registerEvents();
  }

  if (toggleMainBtn) {
    const NavToggle = (await import('./header-nav')).default;

    new NavToggle(toggleMainBtn, navEl, navHideClass).registerEvents();
  }

  if (toggleSearchBtn) {
    const searchToggle = (await import('./header-nav')).default;

    new searchToggle(toggleSearchBtn, searchEl, searchHideClass).registerEvents();
  }
});
