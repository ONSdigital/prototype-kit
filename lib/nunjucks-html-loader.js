import * as fs from 'fs';
import loaderUtils from 'loader-utils';
import nunjucks from 'nunjucks';
import frontmatter from 'frontmatter';
import pretty from 'pretty';
import chalk from 'chalk';
import { htmlErrorStack } from 'print-error';
import marked from 'marked';

import { NunjucksLoader } from './nunjucks-loader';
import { removeFrontmatterFromString } from './remove-frontmatter-from-string';

import { navigationHelper } from './helpers';

function getAllPages(context) {
  return context._module.issuer._identifier
    .slice(7)
    .split(' .')
    .filter(path => !path.includes('node_modules'))
    .sort((a, b) => a.split('/').length - b.split('/').length);
}

function buildSiteMap(context) {
  const templates = getAllPages(context);
  const siteMap = [];

  templates.forEach((path, index) => {
    const frontmatter = getFrontmatterFromFile(context.rootContext + path);
    const sortOrder = frontmatter.sortOrder || index;

    const parent = frontmatter.parent ? siteMap.find(page => page.title === frontmatter.parent) : siteMap;
    const url = path.replace('/pages/', '/').replace('/index.md', '').replace('.md', '') || '/';

    let pageParent;

    if (!Array.isArray(parent)) {
      // Create copy of parent;
      pageParent = { ...parent };

      delete pageParent.children;
    }

    const page = {
      ...frontmatter,
      sortOrder,
      url,
      children: [],
      parent: pageParent
    };

    if (Array.isArray(parent)) {
      parent.push(page);
    } else {
      parent.children.push(page);
    }
  });
  
  return siteMap;
}


function getPageInfo(context, frontmatter) {
  const siteMap = buildSiteMap(context);
  const page = siteMap.find(page => page.title === frontmatter.title || page.children.some(child => child.title === frontmatter.title));
  
  return { 
    url: page.url,
    parentPath: page.parent ? page.parent.url : undefined,
    siteMap, children: page.children,
    parent: page.parent,
    title: frontmatter.title
  };
}

function handleError(error, environment, layoutPath, callback) {
  if (error) {
    console.log('');
    console.log(chalk.red(error.stack));
    let html = htmlErrorStack(error, { fontSize: '10px' });
    html = `{% extends "views/layouts/_error.njk" %}{% block body %}${html}{% endblock %}`;
    html = nunjucks.compile(html, environment).render({
      error: error.toString()
    });

    callback(null, html);
  }
}

function getFrontmatterFromFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const file = fs.readFileSync(filePath, 'utf8');

  const data = frontmatter(file).data || {};

  const source = removeFrontmatterFromString(file);

  data.body =  marked(source, {
    smartypants: true,
    pedantic: true
  });

  return data;
}

export default async function(source) {
  this.cacheable();
  let didError;

  const callback = this.async();
  const options = loaderUtils.getOptions(this) || {};
  const frontmatterData = frontmatter(source).data;
  const pageInfo = getPageInfo(this, frontmatterData);

  // Remove frontmatter from source
  source = removeFrontmatterFromString(source);

  source = marked(source, {
    smartypants: true,
    pedantic: true
  });

  pageInfo.body = source;
  frontmatterData.body = source;

  // Combine context to be passed to template
  const context = Object.assign(
    {
      pageInfo,
      page: frontmatterData,
      data: frontmatterData,
      body: source
    },
    options.context
  );

  let searchPaths = Array.isArray(options.searchPaths) ? options.searchPaths : [option.searchPaths];

  // Get page layout template path
  let layoutPath;

  if (frontmatterData && frontmatterData.layout) {
    layoutPath = `${frontmatterData.layout}.njk`;

    if (layoutPath.slice(0, 1) !== '_' && !layoutPath.includes('/')) {
      layoutPath = `_${layoutPath}`;
    }

    layoutPath = `${options.layoutPath}/${layoutPath}`;
  } else {
    layoutPath = options.defaultLayout;
  }

  const layoutFullPath = findLayout(searchPaths, layoutPath);

  this.addDependency(layoutFullPath);

  // Wrap html in extend for layout
  const extendLayoutPath = `{% extends "${layoutPath}" %}\n`;
  
  // Create nunjucks loader
  const loader = new NunjucksLoader(searchPaths, this.addDependency.bind(this));

  // Create nunjucks environment
  const environment = new nunjucks.Environment(loader);
  nunjucks.configure(null, {
    watch: false,
    autoescape: true
  });

  environment.addGlobal('helpers', {
    navigationHelper,
    addDependency: this.addDependency.bind(this)
  });


  // Render page nunjucks to HTML
  let html = await new Promise(resolve => {
    nunjucks.compile(extendLayoutPath, environment).render(context, (error, result) => {
      if (error) {
        didError = true;
        handleError(error, environment, options.layoutPath, callback);
      } else {
        resolve(result);
      }
    });
  });

  // Prettify HTML to stop markdown wrapping everything in code blocks
  html = pretty(html, {
    ocd: true
  });

  if (!didError) {
    callback(null, html);
  }
}

function findLayout(searchPaths, layoutPath) {
  if (!Array.isArray(searchPaths)) {
    searchPaths = [searchPaths];
  }

  const path = searchPaths.find(searchPath => fs.existsSync(`${searchPath}/${layoutPath}`));

  if (path) {
    return `${path}/${layoutPath}`;
  }
}
