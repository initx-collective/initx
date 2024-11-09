import path from 'node:path'

import fs from 'fs-extra'
import { c } from '@initx-plugin/utils'

import type { InitxPlugin } from './handler'

type Constructor<T> = new (...args: any[]) => T

export interface PackageInfo {
  root: string
  name: string
  version: string
  description: string
  author: string
  homepage?: string
}

export interface InitxPluginInfo {
  packageInfo: PackageInfo
  instance: InitxPlugin
}

export async function loadPlugins(): Promise<InitxPluginInfo[]> {
  const { content: npmPath } = await c('npm', ['config', 'get', 'prefix'])
  const nodeModules = path.join(npmPath as string, 'node_modules')

  const communityPlugins = fs.readdirSync(nodeModules)

  const officialPluginPath = path.join(nodeModules, '@initx-plugin')
  const officialPlugins = fs.existsSync(officialPluginPath)
    ? fs.readdirSync(officialPluginPath).map(name => `@initx-plugin/${name}`)
    : []

  const regexps = {
    plugin: /^(?:@initx-plugin\/|initx-plugin-)/,
    exclude: /@initx-plugin\/(?:core|utils)$/
  }

  const pluginsName = [
    ...officialPlugins,
    ...communityPlugins
  ].filter(
    name => regexps.plugin.test(name) && !regexps.exclude.test(name)
  )

  const x = await import('importx')
  return Promise.all(pluginsName.map(async (dirname) => {
    const pluginRoot = path.join(nodeModules, dirname)

    const InitxPluginClass: Constructor<InitxPlugin> = await x
      .import(pluginRoot, import.meta.url)
      .then(x => x.default)

    const packageAll = JSON.parse(fs.readFileSync(path.join(nodeModules, dirname, 'package.json'), 'utf-8'))
    const packageInfo: PackageInfo = {
      root: pluginRoot,
      name: packageAll.name,
      version: packageAll.version,
      description: packageAll.description,
      author: packageAll.author,
      homepage: packageAll.homepage
    }

    return {
      packageInfo,
      instance: new InitxPluginClass()
    } as InitxPluginInfo
  }))
}
