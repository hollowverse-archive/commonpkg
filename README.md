# commonpkg

*commonpkg* allows you to share common `package.json` properties between different repositories.

## How to use it

Publish your common configurations as an npm module. In the `package.json` of that module, 
add the key `commonpkgShare`. Add any `package.json` properties you want to share 
under this key. For example...

```json
{
  "name": "my-common-config",
  "version": "1.0.0",
  "description": "Common configurations for MyProject repos",
  "repository": "https://github.com/my-project/common-config",
  "license": "Unlicense",
  "commonpkgShare": {
    "scripts": {
      "lint": "tslint '**/*.t{s,sx}' -e '**/node_modules/**' --fix",
      "precommit": "lint-staged"
    },
    "devDependencies": {
      "lint-staged": "^3.4.0",
      "ts-node": "^3.0.3",
      "tslint": "^5.0.0",
      "tslint-config-standard": "^5.0.2",
      "typescript": "^2.1.6"
    },
    "lint-staged": {
      "*.{ts,tsx}": [
        "yarn lint",
        "git add"
      ]
    },
    "pre-commit": "lint-staged"
  }
}
```

Now in the package where you want to inherit these configurations, do the following:

#### Add your common configurations as a dependency:

```
npm install my-common-config --save-dev
```

#### Install *commonpkg*

```
npm install commonpkg --save-dev
```

#### Configure the `package.json`

1. Tell *commonpkg* the name of the package that has your configurations. You do that by adding the key `commonpkg` to
the root of your `package.json`.
1. Add `commonpkg` to your npm scripts. You will use `npm run commonpkg` to run the *commonpkg* script

For example...

```js
{
  "name": "package-where-i-wanna-import-some-configs",
  "version": "1.0.0",
  "main": "dist/index.js",
  "description": "This is My Package",
  "repository": "https://github.com/my-project/my-package.git",
  "license": "Unlicense",
  "scripts": {
    "commonpkg": "commonpkg" // <== add a script like this
  },
  "commonpkg": "my-common-config", // <== add this key to point to the package that has the configs
  "devDependencies": {
    "my-common-config": "^1.0.0",
    "commonpkg": "^2.0.0"
  }
}
```

#### ✨ Run the magic command ✨

Now run `npm run commonpkg` and *commonpkg* will merge the shared properties from `my-common-config` with your 
current `package.json`. After the merge, your `package.json` will look like this:

#### The results

```json
{
  "name": "package-where-i-wanna-import-some-configs",
  "version": "1.0.0",
  "main": "dist/index.js",
  "description": "This is My Package",
  "repository": "https://github.com/my-project/my-package.git",
  "license": "Unlicense",
  "scripts": {
    "commonpkg": "commonpkg",
    "lint": "tslint '**/*.t{s,sx}' -e '**/node_modules/**' --fix",
    "precommit": "lint-staged"
  },
  "commonpkg": "my-common-config",
  "devDependencies": {
    "my-common-config": "^1.0.0",
    "commonpkg": "^2.0.0",
    "lint-staged": "^3.4.0",
    "ts-node": "^3.0.3",
    "tslint": "^5.0.0",
    "tslint-config-standard": "^5.0.2",
    "typescript": "^2.1.6"
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "yarn lint",
      "git add"
    ]
  },
  "pre-commit": "lint-staged"
}
```

If the dependencies between your old `package.json` and new `package.json` are different. *commonpkg* will remind
you to reinstall your `node_modules`. 

You can do `npm run commonpkg` whenever your common configurations
change and *commonpkg* will pull in the updates.

## Bonus tip

You can also use the repo of your common config to check-in files such as `tslint.json`, `.eslintrc`, `.babelrc`, 
etc and extend those config files from your main package, like so:

For example, your `.eslintrc` can be: 

```json
{
  "extends": "./node_modules/my-common-config/.eslintrc",

  "rules": {
    "eqeqeq": 1
  }
}
```

You don't even need *commonpkg* to do this.

## Real example

We use *commonpkg* to share common configurations and files which we keep in our 
[`common-config`](https://github.com/hollowverse/common-config) repository
with other repositories such as 
[`hollowverse`](https://github.com/hollowverse/hollowverse).

## Contributing

The goal of *commonpkg* is to serve the requirements of the Hollowverse project. Unfortunately,
we don't have the resources to fix bugs or implement features that don't affect us.

However, *commonpkg* is not super complicated. Check out its 
[source code](https://github.com/hollowverse/commonpkg/tree/master/src). 

If you need to fix a bug or add a feature, feel free to open an issue to discuss it, 
and we'll be happy to provide pointers on how to approach it.
