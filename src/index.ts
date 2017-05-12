#!/usr/bin/env node
import * as shell from 'shelljs'
import * as fs from 'fs'
import {dependenciesDiffer} from './dependenciesDiffer'
import {exec} from 'child_process'
// the following modules don't support ES6 module import, gotta use legacy import syntax
import pick = require('lodash.pick')
import get = require('lodash.get')
import defaults = require('lodash.defaultsdeep')

// Don't re-run the script if it was already run by `commonpkg` previously in the same process
if (process.env.commonpkgInstall === 'attempted') {
  console.log('=\nFILE: index.ts\nLINE: 13\n=')
  shell.exit(0)
}

console.log('=\nFILE: index.ts\nLINE: 17\n=')

// We need to wait for the original install process to exit before beginning commonpkg's work
// because we need all dependencies to be installed first.

exec('echo starting...').on('exit' , () => {
  console.log('=\nFILE: index.ts\nLINE: 19\n=')
  // We need to find out our `pwd` first. It could be in one of two places
  // 1. `node_modules/commonpkg`
  // 2. `commonpkg/` (i.e. Me working on `commonpkg` and doing `npm install`)
  // In the first case, we should go up two levels `../..` before proceeding.
  // In the second case, we shouldn't change the PWD.
  const isNmCommonpkg = fs.existsSync(`${process.cwd()}/../../node_modules/commonpkg/package.json`)

  if (isNmCommonpkg) {
    console.log('=\nFILE: index.ts\nLINE: 29\n=')
    shell.cd('../..')
  }

  // Now that we are at the right location, we can start doing our thing
  const pwd = process.cwd()
  const userPackageJsonPath = `${pwd}/package.json`
  const userPackageJson = require(userPackageJsonPath)

  // Use Yarn if `yarn.lock` exists in the repo. Otherwise use npm.
  const packageManager = fs.existsSync(`${pwd}/yarn.lock`) ? 'yarn' : 'npm'

  // Get the name of the Common Package
  const theCommonPackageName = userPackageJson.commonpkg || userPackageJson.commonPackage

  if (!theCommonPackageName) {
    console.log('commonpkg: could not find `commonpkg` field in your `package.json`. Exiting...')
    shell.exit(0)
  }

  // Check if theCommonPackage has been installed by the package manager
  const theCommonPackageExists = fs.existsSync(`${pwd}/node_modules/${theCommonPackageName}/package.json`)
  if (!theCommonPackageExists) {
    console.log(
      'commonpkg: your Common Package was not installed. Make sure it ' +
      'is in your dependencies or devDependencies. Exiting...',
    )
    shell.exit(0)
  }

  // Retrieve the content of the Common Package `package.json`
  const theCommonPackagePackageJson = require(`${theCommonPackageName}/package.json`)

  // Let's check which parts of the Common Package are shared
  const shareablePartsNames = theCommonPackagePackageJson.commonpkgShare

  // If we couldn't find any shared parts, let's inform the consumer of the package.
  if (!shareablePartsNames || !Array.isArray(shareablePartsNames)) {
    console.log(
      'commonpkg: the `package.json` of your Common Package is missing the `commonpkgShare` field. ' +
      'Or the `commonpkgShare` field is not an array. Exiting...',
    )
    shell.exit(0)
  }

  // Get the shared parts as a JSON object.
  const shareableProperties = pick(theCommonPackagePackageJson, shareablePartsNames)

  // Merge the shared parts with the `package.json` of the User Package.
  const userNewPackageJson = defaults({}, userPackageJson, shareableProperties)

  // Let's check if the dependencies of the two `package.json` files differ to determine
  // whether we'll need to perform a new install or not.
  const requiresNewInstall = dependenciesDiffer(userPackageJson, userNewPackageJson)

  // Write the new `package.json` to the User Package.
  fs.writeFileSync(userPackageJsonPath, `${JSON.stringify(userNewPackageJson, null, 2)}\n`)

  // Do another install with the new dependencies if necessary
  if (requiresNewInstall) {
    shell.exec(`commonpkgInstall=attempted ${packageManager} install`)
  }
})
