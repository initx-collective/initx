import type { OptionalValue } from '../types'
import type { HandlerInfo, InitxBaseContext, InitxPlugin } from './abstract'
import path from 'node:path'
import process from 'node:process'
import { c } from '@initx-plugin/utils'
import fs from 'fs-extra'

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

const regexps = {
  plugin: /^(?:@initx-plugin\/|initx-plugin-)/,
  exclude: /@initx-plugin\/(?:core|utils)$/
}

async function fetchProjectPlugins(): Promise<InitxPluginInfo[]> {
  const packageJsonPath = path.join(process.cwd(), 'package.json')

  if (!fs.existsSync(packageJsonPath)) {
    return []
  }

  const packageJson = fs.readJsonSync(packageJsonPath)
  const { dependencies = {}, devDependencies = {} } = packageJson

  return Object.keys({
    ...dependencies,
    ...devDependencies
  })
    .filter(name => regexps.plugin.test(name) && !regexps.exclude.test(name))
    .map(name => ({
      name,
      root: path.join(process.cwd(), 'node_modules', name)
    }))
}

export async function fetchPlugins(): Promise<InitxPluginInfo[]> {
  const { content: nodeModules } = await c('npm', ['root', '-g'])

  const communityPlugins = fs.readdirSync(nodeModules)

  const officialPluginPath = path.join(nodeModules, '@initx-plugin')
  const officialPlugins = fs.existsSync(officialPluginPath)
    ? fs.readdirSync(officialPluginPath).map(name => `@initx-plugin/${name}`)
    : []

  return [
    ...officialPlugins,
    ...communityPlugins
  ]
    .filter(name => regexps.plugin.test(name) && !regexps.exclude.test(name))
    .map(name => ({
      name,
      root: path.join(nodeModules, name)
    }))
}

export async function loadPlugins(): Promise<LoadPluginResult[]> {
  const projectPluginsInfo = await fetchProjectPlugins()
  const projectPluginsName = projectPluginsInfo.map(({ name }) => name)

  const globalPlugins = await fetchPlugins()
  const globalPluginsInfo = globalPlugins.filter(({ name }) => !projectPluginsName.includes(name))

  const plugins = [...globalPluginsInfo, ...projectPluginsInfo]

  const x = await import('importx')
  return Promise.all(plugins.map(async ({ root }) => {
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

export async function matchPlugins(
  plugins: LoadPluginResult[],
  { key, cliOptions }: InitxBaseContext,
  ...others: string[]
): Promise<MatchedPlugin[]> {
  const matchedHandlers: MatchedPlugin[] = []

  for (const plugin of plugins) {
    const { instance, packageInfo } = plugin

    const matched = await instance.run({
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

export function inOptional(optional: OptionalValue[], value: string): boolean {
  return optional.some((item) => {
    if (
      typeof item === 'string'
      || typeof item === 'undefined'
    ) {
      return item === value
    }

    return item.test(value)
  })
}
