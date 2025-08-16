import type { OptionalValue } from '../types'
import type { HandlerInfo, InitxBaseContext, InitxPlugin } from './abstract'
import process from 'node:process'
import { pathToFileURL } from 'node:url'
import fs from 'fs-extra'
import pathe from 'pathe'
import { PLUGIN_DIR } from '../constants'

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

async function fetchPackagePlugins(dirctory: string): Promise<InitxPluginInfo[]> {
  const packageJsonPath = pathe.resolve(dirctory, 'package.json')

  if (!fs.existsSync(packageJsonPath)) {
    return []
  }

  const packageJson = fs.readJsonSync(packageJsonPath)
  const { dependencies = {}, devDependencies = {} } = packageJson

  const plugins: InitxPluginInfo[] = []

  Object.keys({
    ...dependencies,
    ...devDependencies
  }).forEach((name) => {
    if (!regexps.plugin.test(name) || regexps.exclude.test(name)) {
      return
    }

    const root = pathe.resolve(dirctory, 'node_modules', name)

    if (!fs.existsSync(root)) {
      return
    }

    plugins.push({
      name,
      root
    })
  })

  return plugins
}

async function fetchProjectPlugins(): Promise<InitxPluginInfo[]> {
  return fetchPackagePlugins(process.cwd())
}

export async function fetchPlugins(): Promise<InitxPluginInfo[]> {
  if (!fs.existsSync(PLUGIN_DIR)) {
    fs.ensureDirSync(PLUGIN_DIR)
    return []
  }

  return fetchPackagePlugins(PLUGIN_DIR)
}

export async function loadPlugins(): Promise<LoadPluginResult[]> {
  const projectPluginsInfo = await fetchProjectPlugins()
  const projectPluginsName = projectPluginsInfo.map(({ name }) => name)

  const globalPlugins = await fetchPlugins()
  const globalPluginsInfo = globalPlugins.filter(({ name }) => !projectPluginsName.includes(name))

  const plugins = [...globalPluginsInfo, ...projectPluginsInfo]

  return Promise.all(plugins.map(async ({ root }) => {
    const packageAll = fs.readJsonSync(pathe.resolve(root, 'package.json'))
    const modulePath = pathToFileURL(pathe.resolve(root, packageAll.main)).href

    const InitxPluginClass: Constructor<InitxPlugin> = (await import(modulePath)).default

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

export function withPluginPrefix(commands: string[]) {
  commands.push('--prefix', PLUGIN_DIR)
  return commands
}
