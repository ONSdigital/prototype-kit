import prototypeNavigationHelper from './helpers/prototype-navigation-helper.js';
import navigationHelper from './helpers/navigation-helper.js';
import subNavigationHelper from './helpers/sub-navigation-helper.js';

export default function installRenderHelpers(nunjucksEnvironment) {
  nunjucksEnvironment.addGlobal('helpers', {
    prototypeNavigationHelper,
    navigationHelper,
    subNavigationHelper
  });
}
