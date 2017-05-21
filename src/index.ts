#!/usr/bin/env node
import * as fs from 'fs'
import {dependenciesDiffer} from './dependenciesDiffer'

// the following modules don't support ES6 module import, gotta use legacy import syntax
import get = require('lodash.get')
import merge = require('lodash.merge')

const pwd = process.cwd()
const userPackageJsonPath = `${pwd}/package.json`
const userPackageJson = require(userPackageJsonPath)
const theCommonPackageName = userPackageJson.commonpkg
const theCommonPackagePackageJson = require(`${theCommonPackageName}/package.json`)
const sharedProperties = theCommonPackagePackageJson.commonpkgShare
const userNewPackageJson = merge({}, userPackageJson, sharedProperties)
const requiresNewInstall = dependenciesDiffer(userPackageJson, userNewPackageJson)

fs.writeFileSync(userPackageJsonPath, `${JSON.stringify(userNewPackageJson, null, 2)}\n`)

if (requiresNewInstall) {
  console.log(
    '❗commonpkg has added new dependencies to your `package.json`. You need to reinstall your `node_modules`',
  )
}
