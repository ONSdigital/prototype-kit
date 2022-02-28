import frontMatter from 'front-matter';
import fs from 'fs';
import nunjucks from 'nunjucks';

import { getPageInfo } from './helpers/site-map';
import mixedMarkdown from './mixed-markdown';

export default function renderPage(templatePath, nunjucksEnvironment) {
  try {
    const data = frontMatter(fs.readFileSync(templatePath, { encoding: 'utf8' }));
    const layout = !!data.attributes.layout ? `prototypes/${data.attributes.layout}` : 'layout/_template';
    const body = mixedMarkdown(data.body);

    let template;
    if (layout === 'none') {
      template = body;
    } else {
      template = `
          {% extends '${layout}.njk' %}
          ${body}
        `;
    }

    const compiledTemplate = nunjucks.compile(template, nunjucksEnvironment, templatePath);
    const pageInfo = getPageInfo(templatePath);

    return compiledTemplate.render({
      pageInfo,
      page: pageInfo,
      data: pageInfo,
      prototypeListing: Array.from(pageInfo.lookup.values())
    });
  } catch (err) {
    console.error(`An error occurred whilst rendering: ${templatePath}`);
    throw err;
  }
}
