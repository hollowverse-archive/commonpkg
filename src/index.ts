#!/usr/bin/env node
import * as shelljs from 'shelljs'
import * as fs from 'fs'

// the following modules don't support ES6 module import, gotta use legacy import syntax
import merge = require('lodash.merge')
import pick = require('lodash.pick')
import get = require('lodash.get')

// This process starts at `commonpkg/`. If we go two levels up, we find the User Package.
shelljs.cd('../..')

const pwd = process.cwd()
const userPackageJsonPath = `${pwd}/package.json`
const userPackageJson = require(userPackageJsonPath)

if (
  // Don't re-run the script if it was already run by `commonpkg` previously in the same process
  process.env.commonpkgInstall === 'attempted' ||

  // Also don't run the script if this is `commonpkg` using `commonpkg`.
  userPackageJson.name === 'commonpkg'
) {
  shelljs.exit(0)
}

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
const userNewPackageJson = merge(userPackageJson, shareableProperties)

// Write the new `package.json` to the User Package.
fs.writeFileSync(userPackageJsonPath, `${JSON.stringify(userNewPackageJson, null, 2)}\n`)

// Do another install with the new dependencies.
shelljs.exec(`commonpkgInstall=attempted ${packageManager} install`)
