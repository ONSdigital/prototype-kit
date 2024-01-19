# ONS Prototype Kit

A prototyping kit that uses the [ONS Design System](https://ons-design-system.netlify.com/) [(GitHub)](https://github.com/ONSdigital/design-system).

## Using this prototype kit

### Prerequisites

You'll need [Git](https://help.github.com/articles/set-up-git/), [Node.js](https://nodejs.org/en/), and [Yarn](https://yarnpkg.com/en/docs/getting-started) to run this project locally.

The version of node required is outlined in [.nvmrc](./.nvmrc).

### Local git configuration

Make sure your local git configuration is set up to use `main` as the default branch when initialising a new repository.

```bash
git config --global init.defaultBranch main
```

### Creating a prototype kit project

1. [Create a new repository for your prototypes using the prototype-kit template on GitHub](https://github.com/ONSdigital/prototype-kit-template/generate)

2. [Clone the code of your new repository](https://docs.github.com/en/repositories/creating-and-managing-repositories/cloning-a-repository) to a new folder on your device, so you can start building your prototypes.

3. Install the latest version of the [design system](https://ons-design-system.netlify.com/):

   In the terminal:

```bash
yarn add @ons/design-system
```

4. Review [README](https://github.com/ONSdigital/prototype-kit#readme) for further information on how to use the new prototype-kit project.

### Using nvm (optional)

If you work across multiple Node.js projects there's a good chance they require different Node.js and npm versions.

To enable this we use [nvm (Node Version Manager)](https://github.com/creationix/nvm) to switch between versions easily.

1. [install nvm](https://github.com/creationix/nvm#installation)
2. Run nvm install in the project directory (this will use .nvmrc)

#### Windows users

The nvm listed above is only for Mac/Linux users. A separate version of nvm is available for Windows here: https://github.com/coreybutler/nvm-windows

### Install dependencies

```bash
yarn install
```

### Release Process

To make changes available to be used in prototype repos you will need to create a new github tag. To do this in the command line run:

```bash
git tag <tag-name>
git push origin --tags
```

Then in the repo that uses the prototype kit this will need to be updated to reflect that new tag.
