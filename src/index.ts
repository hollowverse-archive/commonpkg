#!/usr/bin/env node
import * as shelljs from 'shelljs'
import * as fs from 'fs'
import * as minimist from 'minimist'

// the following modules don't support ES6 module import, gotta use legacy import syntax
/* tslint:disable:no-require-imports */
import merge = require( 'lodash.merge' )
import pick = require( 'lodash.pick' )
/* tslint:enable:no-require-imports */

const args = minimist(process.argv.slice(2))
const pwd = process.cwd()
const packageManager = fs.existsSync(`${pwd}/yarn.lock`) ? 'yarn' : 'npm'
const packageJsonPath = `${pwd}/package.json`
const userPackageJson = require(packageJsonPath)
const theCommonPackage = userPackageJson.commonpkg || userPackageJson.commonPackage
const theCommonPackagePackageJson = require(`${pwd}/node_modules/${theCommonPackage}/package.json`)
const command = args._[0]
const shareablePartsNames = theCommonPackagePackageJson.commonpkgShare

if (
  (
    command === 'updatePackageJson' ||
    command === 'updatePkgJson'
  ) && (
    Array.isArray(shareablePartsNames)
  )
) {
  const shareableProperties = pick(theCommonPackagePackageJson, shareablePartsNames)
  const userNewPackageJson = merge(userPackageJson, shareableProperties)

  fs.writeFileSync(packageJsonPath, JSON.stringify(userNewPackageJson, null, 2))

  if (process.env.commonpkgInstall !== 'attempted') {
    shelljs.exec(`commonpkgInstall=attempted ${packageManager} install`)
  }
}

shelljs.exit(0)
