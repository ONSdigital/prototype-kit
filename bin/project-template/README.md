# {{PROJECT_NAME}}

This is a prototype project that was created using the {{PROTOTYPE_KIT_PACKAGE_NAME}} package's `create-prototype` command. This prototype uses the ONS design system to render page layouts and components.

Refer to the [prototype kit repository]({{PROTOTYPE_KIT_HOMEPAGE}}) for further information regarding usage of the prototype kit.

## How to use this project?

This project comes with the following commands:

- `yarn start` - Builds prototype content and starts a local server for previewing content changes. The command displays the URL for accessing the local server.

- `yarn watch` - Starts a local server for previewing content changes. The command displays the URL for accessing the local server. Unlike `yarn start`, this command does not perform an initial build.

- `yarn build` - Builds prototype content as a static website to a 'build' directory inside this project. The output of this command could be used by a CI process to deploy the prototype website.

## Getting started

1. Rename the example prototype directory from 'example' to something appropriate for this project.

2. Create prototype by editing the prototype entry points (`index.njk`, `index.js` and `index.scss`).

3. Preview the prototype by running `yarn start`.

## How do the build commands work?

This project uses [gulp](https://gulpjs.com/) to automate the above commands. The [prototype kit]({{PROTOTYPE_KIT_HOMEPAGE}}) provides default gulp tasks which are used by this repository which are inherited in the `./gulpfile.js` script.

Additional gulp tasks can be added to this project's `gulpfile.js` in the usual way. Refer to the gulp documentation for information on how to do this.

## Using a specific version of the design system

Begin by adding a reference to the specific design system version in the `package.json` file of this repository; for example, if version 44.0.0 were required then this would look like this:

```json
"dependencies": {
  "@ons/design-system/44.0.0": "npm:@ons/design-system@44.0.0",
  ...
```

And then add the `version` attribute at the top of each Nunjucks template that requires this specific design system version:

```nunjucks
---
version: 44.0.0
---
<p>This page uses design system version 44.0.0.</p>
```
