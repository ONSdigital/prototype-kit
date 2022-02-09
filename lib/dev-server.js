import express from 'express';

import createNunjucksEnvironment from './rendering/create-nunjucks-environment.js';
import { getSiteMap } from './rendering/helpers/site-map';
import installRenderHelpers from './rendering/install-render-helpers';
import renderPage from './rendering/render-page.js';

process.env.IS_DEV_SERVER = true;

const app = express();

app.use((req, res, next) => {
  const internalRequestPath = (req.path ?? '/').substr(1);
  let rawRequestPath = internalRequestPath;
  if (rawRequestPath !== '' && !rawRequestPath.endsWith('/')) {
    rawRequestPath += '/';
  }

  const siteMap = getSiteMap();

  const requestAttempts = [
    `${internalRequestPath}`,
    `${internalRequestPath}.html`,
    !!rawRequestPath ? `${rawRequestPath}index.html` : 'index.html'
  ];

  const requestEntryUrl = requestAttempts.find(attempt => siteMap.routes.has(attempt));
  const requestEntry = siteMap.routes.get(requestEntryUrl);
  if (!requestEntry) {
    next();
    return;
  }

  const nunjucksEnvironment = createNunjucksEnvironment(null, requestEntry.version);
  installRenderHelpers(nunjucksEnvironment);

  const output = renderPage(requestEntry.templatePath, nunjucksEnvironment);
  res.send(output);
});

app.use(express.static('./build'));

app.listen(4010);
