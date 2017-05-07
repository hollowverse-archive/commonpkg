#!/usr/bin/env node
import * as shelljs from 'shelljs'
import * as fs from 'fs'
import * as path from 'path'
import {dependenciesDiffer} from './dependenciesDiffer'

// the following modules don't support ES6 module import, gotta use legacy import syntax
import merge = require('lodash.merge')
import pick = require('lodash.pick')
import get = require('lodash.get')

// This process should start at `node_modules/commonpkg/`.
// If we go one level up, we should be in `node_modules`
shelljs.cd('..')

if (
  // Don't re-run the script if it was already run by `commonpkg` previously in the same process
  process.env.commonpkgInstall === 'attempted' ||

  // Also don't run the script if we're not inside `node_modules` at this point because that
  // means this repo is running this script because we did `npm install` inside commonpkg repo
  process.cwd().split(path.sep).pop() !== 'node_modules'
) {
  shelljs.exit(0)
}

// If we go one more level up, we'll be at the desired location: the User Package that depends on
// commonpkg.
shelljs.cd('..')

const pwd = process.cwd()
const userPackageJsonPath = `${pwd}/package.json`
const userPackageJson = require(userPackageJsonPath)

// Use Yarn if `yarn.lock` exists in the repo. Otherwise use npm.
const packageManager = fs.existsSync(`${pwd}/yarn.lock`) ? 'yarn' : 'npm'

// Get the name of the Common Package
const theCommonPackageName = userPackageJson.commonpkg || userPackageJson.commonPackage

let theCommonPackagePackageJson
let theCommonPackageExists = true

// Check if theCommonPackage has been installed by the package manager
try {
  theCommonPackagePackageJson = require(`${theCommonPackageName}/package.json`)
} catch (e) {
  theCommonPackageExists = false
}

if (!theCommonPackageExists) {
  // If we're here, that means the theCommonPackage hasn't been installed yet.
  // We need to install it before we can proceed.

  const theCommonPackageVersion = (
    get(userPackageJson, `devDependencies.${theCommonPackageName}`) ||
    get(userPackageJson, `dependencies.${theCommonPackageName}`)
  )

  // At this point we have the data that we need about the Common Package. We can use
  // the package manager of the repo to install it.
  const installCommand = packageManager === 'yarn' ? 'add' : 'install'

  shelljs.exec(
    `${packageManager} ${installCommand} ${theCommonPackageName}@${theCommonPackageVersion}`,
  )

  // Now that we've installed the common package, let's try to grab its `package.json` again
  theCommonPackagePackageJson = require(`${theCommonPackageName}/package.json`)
}

// At this point we hopefully have the Common Package. Let's check which parts of it are to be shared
const shareablePartsNames = theCommonPackagePackageJson.commonpkgShare

// If we couldn't find any shared parts, let's inform the consumer of the package.
if (!Array.isArray(shareablePartsNames)) {
  throw new Error(
    'commonpkg: the `package.json` of your Common Package is missing the `commonpkgShare` field.',
  )
}

// Get the shared parts as a JSON object.
const shareableProperties = pick(theCommonPackagePackageJson, shareablePartsNames)

// Merge the shared parts with the `package.json` of the User Package.
const userNewPackageJson = merge({}, userPackageJson, shareableProperties)

// Let's check if the dependencies of the two `package.json` files differ to determine
// whether we'll need to perform a new install or not.
const requiresNewInstall = dependenciesDiffer(userPackageJson, userNewPackageJson)

// Write the new `package.json` to the User Package.
fs.writeFileSync(userPackageJsonPath, `${JSON.stringify(userNewPackageJson, null, 2)}\n`)

// Do another install with the new dependencies if necessary
if (requiresNewInstall) {
  shelljs.exec(`commonpkgInstall=attempted ${packageManager} install`)
}
