import type { PluginInfo } from 'npm-plugin-kit'
import type { OptionalValue } from '../types'
import type { HandlerInfo, InitxBaseContext, InitxPlugin } from './abstract'
import type { InitxPluginExtra } from './system'
import { existsSync, readFileSync } from 'node:fs'
import process from 'node:process'
import pathe from 'pathe'
import { pluginSystem } from './system'

export interface PackageInfo {
  root: string
  name: string
  version: string
  description: string
  author: string
  homepage?: string
  isLocal: boolean
}

export interface InitxPluginInfo {
  name: string
  version: string
  description: string
  homepage?: string

  /**
   * Plugin root path
   */
  root: string
  isLocal: boolean
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

function isInitxPluginName(name: string): boolean {
  return regexps.plugin.test(name) && !regexps.exclude.test(name)
}

function pickOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

function formatAuthor(author: unknown): string {
  if (typeof author === 'string')
    return author
  if (author && typeof author === 'object' && 'name' in author)
    return String((author as { name: unknown }).name)
  return ''
}

function toInitxPluginInfo(info: PackageInfo): InitxPluginInfo {
  return {
    name: info.name,
    version: info.version,
    description: info.description,
    homepage: info.homepage,
    root: info.root,
    isLocal: info.isLocal
  }
}

function packageInfoFromListEntry(entry: PluginInfo<InitxPluginExtra>): PackageInfo {
  const { name, packageInfo, plugin } = entry
  return {
    root: plugin.root,
    name,
    version: packageInfo.version,
    description: packageInfo.description,
    author: formatAuthor(packageInfo.author),
    homepage: pickOptionalString(packageInfo.homepage),
    isLocal: plugin.isLocal
  }
}

function packageInfoFromPackageJson(root: string, packageAll: Record<string, any>): PackageInfo {
  return {
    root,
    name: packageAll.name,
    version: packageAll.version ?? '',
    description: packageAll.description ?? '',
    author: formatAuthor(packageAll.author),
    homepage: pickOptionalString(packageAll.homepage),
    isLocal: false
  }
}

async function fetchPackagePlugins(directory: string): Promise<PackageInfo[]> {
  const packageJsonPath = pathe.resolve(directory, 'package.json')

  if (!existsSync(packageJsonPath)) {
    return []
  }

  const packageJson = readJson(packageJsonPath)
  const { dependencies = {}, devDependencies = {} } = packageJson

  const plugins: PackageInfo[] = []

  for (const name of Object.keys({ ...dependencies, ...devDependencies })) {
    if (!isInitxPluginName(name))
      continue

    const root = pathe.resolve(directory, 'node_modules', name)
    if (!existsSync(root))
      continue

    const pluginPackageJson = readJson(pathe.resolve(root, 'package.json'))
    plugins.push({
      ...packageInfoFromPackageJson(root, pluginPackageJson),
      name
    })
  }

  return plugins
}

async function fetchProjectPlugins(): Promise<PackageInfo[]> {
  return fetchPackagePlugins(process.cwd())
}

export async function fetchPlugins(): Promise<InitxPluginInfo[]> {
  const installedPlugins = await pluginSystem.list()

  return installedPlugins
    .filter(({ name }) => isInitxPluginName(name))
    .map(entry => toInitxPluginInfo(packageInfoFromListEntry(entry)))
}

export async function loadPlugins(): Promise<LoadPluginResult[]> {
  const projectPluginsInfo = await fetchProjectPlugins()
  const projectPluginNames = new Set(projectPluginsInfo.map(({ name }) => name))

  const installedPlugins = await pluginSystem.list()
  const globalEntries = installedPlugins.filter(
    ({ name }) => isInitxPluginName(name) && !projectPluginNames.has(name)
  )

  const loadOne = async (name: string, packageInfo: PackageInfo): Promise<LoadPluginResult> => {
    const InitxPluginClass = await pluginSystem.load(name)
    return {
      packageInfo,
      instance: new InitxPluginClass()
    }
  }

  const globalLoads = globalEntries.map(async (entry) => {
    const { name } = entry
    return loadOne(name, packageInfoFromListEntry(entry))
  })

  const projectLoads = projectPluginsInfo.map(async (packageInfo) => {
    return loadOne(packageInfo.name, packageInfo)
  })

  return Promise.all([...globalLoads, ...projectLoads])
}

export async function matchPlugins(
  plugins: LoadPluginResult[],
  { key, cliOptions, optionsList }: InitxBaseContext,
  ...others: string[]
): Promise<MatchedPlugin[]> {
  const matchedHandlers: MatchedPlugin[] = []

  for (const plugin of plugins) {
    const { instance, packageInfo } = plugin

    const matched = await instance.run({
      key,
      cliOptions,
      packageInfo,
      optionsList
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

function readJson(path: string): Record<string, any> {
  return JSON.parse(readFileSync(path, 'utf8'))
}
