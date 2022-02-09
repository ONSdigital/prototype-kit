import navigationHelper from './helpers/navigation-helper.js';
import cardsNavigationHelper from './helpers/cards-navigation-helper.js';

export default function installRenderHelpers(nunjucksEnvironment) {
  nunjucksEnvironment.addGlobal('helpers', {
    navigationHelper,
    cardsNavigationHelper
  });
}
