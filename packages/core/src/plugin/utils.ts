import path from 'node:path'

import fs from 'fs-extra'
import { c } from '@initx-plugin/utils'

import type { HandlerInfo, InitxBaseContext, InitxPlugin } from './abstract'

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
  /**
   * Plugin name
   */
  name: string

  /**
   * Plugin root path
   */
  root: string
}

export interface LoadPluginResult {
  packageInfo: PackageInfo
  instance: InitxPlugin
}

export type MatchedPlugin = HandlerInfo & {
  packageInfo: PackageInfo
}

export async function fetchPlugins(): Promise<InitxPluginInfo[]> {
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

  return [
    ...officialPlugins,
    ...communityPlugins
  ].filter(
    name => regexps.plugin.test(name) && !regexps.exclude.test(name)
  ).map(name => ({
    name,
    root: path.join(nodeModules, name)
  }))
}

export async function loadPlugins(): Promise<LoadPluginResult[]> {
  const pluginsInfo = await fetchPlugins()

  const x = await import('importx')
  return Promise.all(pluginsInfo.map(async ({ root }) => {
    const InitxPluginClass: Constructor<InitxPlugin> = await x
      .import(root, import.meta.url)
      .then(x => x.default)

    const packageAll = fs.readJsonSync(path.join(root, 'package.json'))
    const packageInfo: PackageInfo = {
      root,
      name: packageAll.name,
      version: packageAll.version,
      description: packageAll.description,
      author: packageAll.author,
      homepage: packageAll.homepage
    }

    return {
      packageInfo,
      instance: new InitxPluginClass()
    } as LoadPluginResult
  }))
}

export function matchPlugins(
  plugins: LoadPluginResult[],
  { key, cliOptions }: InitxBaseContext,
  ...others: string[]
): MatchedPlugin[] {
  const matchedHandlers: MatchedPlugin[] = []

  for (const plugin of plugins) {
    const { instance, packageInfo } = plugin

    const matched = instance.run({
      key,
      cliOptions,
      packageInfo,
      optionsList: Object.keys(cliOptions).filter(key => cliOptions[key] === true).map(key => `--${key}`)
    }, ...others)

    matchedHandlers.push(...matched.map(item => ({
      handler: item.handler,
      description: item.description,
      packageInfo
    })))
  }

  return matchedHandlers
}
