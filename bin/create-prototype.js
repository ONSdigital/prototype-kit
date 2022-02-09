#!/usr/bin/env node

import fs from 'fs-extra';
import path from 'path';
import util from 'util';
import url from 'url';
import { exec as _exec } from 'child_process';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const exec = util.promisify(_exec);

const prototypeKitInfo = fs.readJSONSync(path.resolve(__dirname, '../package.json'));

createPrototypesProject();

async function createPrototypesProject() {
  // Retrieve project name from CLI argument.
  const projectName = process.argv[2];
  if (!projectName || !/^[a-z][a-z0-9\-]+/.test(projectName)) {
    console.error('A name must be specified for the prototype of the form "foo-bar-prototypes" without quotes.');
    process.exit(1);
  }

  logStatus('Creating project');

  // Make a directory for the prototype; fail if the directory already exists to avoid losing work.
  const outputProjectPath = path.resolve(process.cwd(), projectName);
  await fs.mkdir(outputProjectPath);

  // Prepare 'project.json', 'gulpfile.js' and 'README.md' for the prototype(s) project.
  await prepareProjectFileFromTemplate('./package.json', projectName, outputProjectPath);
  await prepareProjectFileFromTemplate('./gulpfile.js', projectName, outputProjectPath);
  await prepareProjectFileFromTemplate('./README.md', projectName, outputProjectPath);

  // Copy other project files.
  await copyProjectFileFromTemplate('./dot_gitignore', outputProjectPath, './.gitignore');
  await copyProjectFileFromTemplate('./dot_editorconfig', outputProjectPath, './.editorconfig');

  // Copy example prototype into the new project.
  const projectTemplateSrcPath = path.resolve(__dirname, './project-template/src');
  const outputSrcPath = path.resolve(outputProjectPath, 'src');
  await fs.copy(projectTemplateSrcPath, outputSrcPath);

  logStatus('Initialising git repository');
  await exec(`cd ${outputProjectPath} && git init`);

  logStatus('Installing yarn dependencies');
  await exec(`cd ${outputProjectPath} && yarn`);
  logStatus('Installing latest version of the design system');
  await exec(`cd ${outputProjectPath} && yarn add @ons/design-system`);

  console.log(`Project created at path '${outputProjectPath}'.`);
  console.log('Refer to README.md for some information about the project.');
}

function logStatus(status) {
  console.log(`    ${status}...`);
}

async function prepareProjectFileFromTemplate(templateFile, projectName, projectOutputPath) {
  const templatePath = path.resolve(__dirname, './project-template', templateFile);
  const template = await fs.readFile(templatePath, { encoding: 'utf8' });
  const output = template
    .replace(/{{PROTOTYPE_KIT_PACKAGE_NAME}}/g, prototypeKitInfo.name)
    .replace(/{{PROTOTYPE_KIT_HOMEPAGE}}/g, prototypeKitInfo.homepage)
    .replace(/{{PROJECT_NAME}}/g, projectName)
    .replace(/{{PROTOTYPE_KIT_VERSION}}/, prototypeKitInfo.version);

  const outputPath = path.resolve(projectOutputPath, path.basename(templateFile));
  await fs.writeFile(outputPath, output, { encoding: 'utf8' });
}

async function copyProjectFileFromTemplate(templateFile, projectOutputPath, outputFile) {
  const templatePath = path.resolve(__dirname, './project-template', templateFile);
  const outputPath = path.resolve(projectOutputPath, outputFile);
  await fs.copyFile(templatePath, outputPath);
}
