# commonpkg

*commonpkg* allows you to share common `package.json` properties between different repositories.
It works with both npm and Yarn.

## How it works

Say you have two packages, `package-a` and `package-b`, where you want to share some common 
`package.json` properties, like `scripts`, `dependencies`, etc.

To share these properties with *commonpkg*, you create a 3rd package for your common properties, 
name it whatever, and put in it a `package.json` like the following:

```json
{
  "name": "my-common-config",
  "version": "1.0.6",
  "description": "Common configurations for MyProject repos",
  "repository": "https://github.com/my-project/common-config",
  "license": "Unlicense",
  "scripts": {
    "lint": "tslint '**/*.t{s,sx}' -e '**/node_modules/**' --fix",
    "precommit": "lint-staged"
  },
  "devDependencies": {
    "husky": "^0.13.3",
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
  "pre-commit": "lint-staged",
  "commonpkgShare": [
    "scripts", "devDependencies", "lint-staged", "pre-commit"
  ]
}
```

The `package.json` above contains the properties you want to share between your packages. 
Notice the key `commonpkgShare`. This key specifies the exact properties that you want to make common. 
The properties which are not specified here will not be shared.

Now in your `package-a` or `package-b`, you can have a `package.json` like the following:

```json
{
  "name": "package-a",
  "version": "1.0.0",
  "main": "dist/index.js",
  "description": "This is Package A",
  "repository": "https://github.com/my-project/package-a.git",
  "license": "Unlicense",
  "commonpkg": "my-common-config",
  "devDependencies": {
    "my-common-config": "my-common-config",
    "commonpkg": "^1.0.0"
  }
}
```

With that, after you do an `npm install` or a `yarn install` in your `package-a`, *commonpkg*
will look for the key `commonpkg` in the `package.json` of your `package-a`. 
This key points to the exact dependency which has your common `package.json`, in this case
`my-common-config`. *commonpkg* will then merge `my-common-config/package.json` with 
`package-a/package.json` and install any new dependencies.

Now you have a `package-a/package.json` that is up-to-date with your `my-common-config/package.json`.

### tl;dr

Merge the text of your `package.json` with the text of another `package.json` automatically
when you do `npm install`.

## Install

```bash
npm i commonpkg --save-dev
```

## Documentation

With *commonpkg* there are two types of packages, a User Package and a Common Package.
 
A **User Package** is a package that **inherits** the common `package.json`.

A **Common Package** is a package that **contains** the common `package.json`.

For *commonpkg* to work, there are some required keys that have to appear 
in the `package.json` files of the User Package and the Common Package

### Required keys in User Package

#### `commonpkg`

You need to have the key `commonpkg` at the root of your User Package `package.json` which
points to the name of your Common Package.

For example:

```json
{
  "commonpkg": "my-common-package"
}
```

#### `devDependencies.commonpkg` or `dependencies.commonpkg`

You also need to add the npm module *commonpkg* as a `dependency` or 
`devDependency` of your User Package.

#### `devDependencies.nameOfYourCommonPackage` or `dependencies.nameOfYourCommonPackage`

You also need to add your Common Package as a `dependency` or `devDependency` of your User Package.

### Required keys in Common Package

The `package.json` of your Common Package can have any keys you want, but for those keys to be
merged with User Packages, you need the following key:

#### `commonpkgShare`

This key is an array. For example:

```json
{
  "commonpkgShare": [
    "scripts", "devDependencies", "lint-staged", "pre-commit"
  ]
}
```

## Bonus tip

You can also use your Common Package to check-in files such as `.eslintrc`, `.babelrc`, etc and 
extend those dot-files from your User Package, like so:

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
[`release-manager`](https://github.com/hollowverse/release-manager).

## Contributing

The goal of *commonpkg* is to serve the requirements of the Hollowverse project. Unfortunately,
we don't have the resources to fix bugs or implement features that don't affect us.

However, *commonpkg* is not super complicated. Check out its 
[source code](https://github.com/hollowverse/commonpkg/tree/master/src). 

If you need to fix a bug or add a feature, feel free to open an issue to discuss it, 
and we'll be happy to provide pointers on how to approach it.
