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


function getAllTemplates(context) {
  return context._module.issuer._identifier
    .slice(7)
    .split(' .')
    .filter(path => !path.includes('node_modules'))
    .sort((a, b) => a.split('/').length - b.split('/').length);
}

function buildSiteMap(context) {
  const templates = getAllTemplates(context);
  const siteMap = [];

  templates.forEach(path => {
    const pathParts = path.split('/').slice(1);
    const frontmatter = getFrontmatterFromFile(context.rootContext + path);
    const sortOrder = frontmatter.sortOrder || Infinity;
    const group = frontmatter.group || '';
    let ref = siteMap;

    pathParts.forEach((part, index) => {
      if (part.includes('.njk')) {
        // If is page
        const key = part.replace('.njk', '');
        let title = frontmatter.title;

        // Set title
        if (!title) {
          if (key.toLowerCase() === 'index') {
            title = pathParts[index - 1];
          } else {
            title = key;
          }
        }

        // Add page to siteMap
        ref.push({
          title,
          sortOrder,
          group,
          url: path.replace('/index.njk', '').replace('.njk', '') || '/'
        });
      } else {
        const newRef = ref.find(page => page.url === `/${part}`);

        if (newRef) {
          if (!newRef.children) {
            newRef.children = [];
          }

          ref = newRef.children;
        }
      }
    });
  });

  return siteMap;
}

function getPageInfo(context) {
  const siteMap = buildSiteMap(context);
  let path = context.resourcePath.replace(context.rootContext, '');
  const pathParts = path.split('/').slice(1);
  const pathDepth = pathParts.length;

  let parent;
  let pageRef = siteMap;
  let pathRef = '';

  pathParts.forEach((part, index) => {
    if (pageRef) {
      part = `/${part.replace('index.njk', '').replace('.njk')}`;
      pathRef += part;

      if (pageRef && index === pathDepth - 2) {
        parent = Object.assign({}, pageRef);
      }

      if (part !== '/' && pageRef.children) {
        pageRef = pageRef.children;
      }

      const pathRefLength = pathRef.length;
      if (pathRefLength > 1 && pathRef[pathRefLength - 1] === '/') {
        pathRef = pathRef.slice(0, -1);
      }

      if (Array.isArray(pageRef)) {
        pageRef = pageRef.find(page => page.url === pathRef);
      }
    }
  });

  path = path.replace('/index.njk', '').replace('.njk', '') || '/';
  
  const parentPath = `/${pathParts.slice(0, pathDepth - 1).join('/')}`;

  if (pageRef) {
    const title = pageRef.title;
    const children = pageRef.children;

    return { path, parentPath, siteMap, children, parent, title };
  } else {
    return { path, parentPath };
  }
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
  return frontmatter(file).data || {};
}

export default async function(source) {
  this.cacheable();
  let didError;

  const callback = this.async();
  const options = loaderUtils.getOptions(this) || {};
  const pageInfo = getPageInfo(this);
  const frontmatterData = frontmatter(source).data;

  // Remove frontmatter from source
  source = removeFrontmatterFromString(source);

  source = marked(source, {
    smartypants: true,
    pedantic: true
  });

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
  source = `{% extends "${layoutPath}" %}\n${source}`;
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
    nunjucks.compile(source, environment).render(context, (error, result) => {
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
