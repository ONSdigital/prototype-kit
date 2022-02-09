import navigationHelper from './helpers/navigation-helper.js';

export default function installRenderHelpers(nunjucksEnvironment) {
  nunjucksEnvironment.addGlobal('helpers', {
    navigationHelper
  });
}
