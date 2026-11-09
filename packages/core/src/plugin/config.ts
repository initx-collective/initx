import type { LoadConfigSource } from 'unconfig'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { basename, dirname, extname, parse as parsePath, resolve } from 'node:path'
import process from 'node:process'
import { importx } from 'importx'
import { loadConfig } from 'unconfig'
import { parse as parseYaml } from 'yaml'

export const INITX_CONFIG_FORMATS = ['ts', 'js', 'json', 'yaml', 'ini'] as const

export type InitxConfigFormat = typeof INITX_CONFIG_FORMATS[number]

export interface InitxConfigOptions<TConfig = unknown> {
  /**
   * Configuration name prefixes. Core expands each prefix to
   * `${prefix}.config.${format}`.
   */
  files: readonly string[]

  /**
   * Allowed configuration formats. Defaults to TypeScript.
   */
  formats?: InitxConfigFormat[]

  /**
   * Value exposed when no configuration file is found.
   */
  defaults?: TConfig
}

export type InitxPluginConfig<TConfig = unknown> = true | InitxConfigOptions<TConfig>

/**
 * Declaration shape accepted on a plugin class. Runtime validation narrows
 * format names to INITX_CONFIG_FORMATS after TypeScript class property
 * inference has widened literal arrays to string[].
 */
export interface InitxConfigDeclaration<TConfig = unknown> {
  files: readonly string[]
  formats?: readonly string[]
  defaults?: TConfig
}

export type InitxPluginConfigDeclaration<TConfig = unknown> = true | InitxConfigDeclaration<TConfig>

export interface LoadedInitxConfig<TConfig = unknown> {
  config: TConfig | undefined
  source?: string
}

export class InitxConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InitxConfigError'
  }
}

const CONFIG_OPTION = 'config'

function isConfigFormat(value: string): value is InitxConfigFormat {
  return (INITX_CONFIG_FORMATS as readonly string[]).includes(value)
}

function pluginNameFromPackage(packageName: string): string {
  if (packageName.startsWith('@initx-plugin/'))
    return packageName.slice('@initx-plugin/'.length)

  if (packageName.startsWith('initx-plugin-'))
    return packageName.slice('initx-plugin-'.length)

  throw new InitxConfigError(`Invalid initx plugin name: ${packageName}`)
}

export function getPluginName(packageName: string): string {
  return pluginNameFromPackage(packageName)
}

function normalizePrefix(prefix: string): string {
  const normalized = prefix.trim()
  if (!normalized || normalized.includes('/') || normalized.includes('\\') || normalized.includes('\0'))
    throw new InitxConfigError(`Invalid initx config prefix: ${JSON.stringify(prefix)}`)

  return normalized
}

function normalizeOptions<TConfig>(
  spec: InitxPluginConfigDeclaration<TConfig> | undefined,
  packageName: string
): InitxConfigOptions<TConfig> | undefined {
  if (!spec)
    return undefined

  if (spec === true) {
    return {
      files: [`initx-${pluginNameFromPackage(packageName)}`],
      formats: ['ts']
    }
  }

  const files = spec.files.map(normalizePrefix)
  if (!files.length)
    throw new InitxConfigError('Initx config files cannot be empty')

  const formats = spec.formats?.length ? [...spec.formats] : ['ts']
  for (const format of formats) {
    if (!isConfigFormat(format))
      throw new InitxConfigError(`Unsupported initx config format: ${format}`)
  }

  return { ...spec, files, formats: formats as InitxConfigFormat[] }
}

function configSources<TConfig>(options: InitxConfigOptions<TConfig>): LoadConfigSource<TConfig>[] {
  const formats = options.formats ?? ['ts']

  return options.files.flatMap(prefix => formats.map((format) => {
    const source: LoadConfigSource<TConfig> = {
      files: `${prefix}.config`,
      extensions: [format]
    }

    if (format === 'yaml' || format === 'ini')
      source.parser = filepath => parseTextConfig(filepath, format)

    return source
  }))
}

async function parseTextConfig<TConfig>(
  filepath: string,
  format: 'yaml' | 'ini'
): Promise<TConfig | undefined> {
  const text = await readFile(filepath, 'utf8')
  if (format === 'yaml')
    return parseYaml(text) as TConfig | undefined

  const iniModule = 'ini'
  const { parse: parseIni } = await import(iniModule)
  return parseIni(text) as TConfig | undefined
}

function explicitConfigPath(
  rawValue: unknown,
  cwd: string,
  formats: InitxConfigFormat[]
): { path: string, format: InitxConfigFormat } | undefined {
  if (rawValue === undefined)
    return undefined

  if (typeof rawValue !== 'string' || !rawValue.trim())
    throw new InitxConfigError('--config requires a single file path')

  const path = resolve(cwd, rawValue)
  const extension = extname(path).slice(1).toLowerCase()
  if (!isConfigFormat(extension) || !formats.includes(extension)) {
    throw new InitxConfigError(
      `Unsupported initx config format ".${extension || '(none)'}". Allowed formats: ${formats.join(', ')}`
    )
  }

  if (!existsSync(path))
    throw new InitxConfigError(`Initx config file not found: ${path}`)

  return { path, format: extension }
}

async function loadExplicitConfig<TConfig>(
  path: string,
  format: InitxConfigFormat
): Promise<TConfig | undefined> {
  if (format === 'yaml' || format === 'ini')
    return parseTextConfig<TConfig>(path, format)

  const file = parsePath(path)
  const loaded = await loadConfig<TConfig>({
    cwd: file.dir,
    merge: false,
    sources: [{
      files: basename(path, file.ext),
      extensions: [format]
    }]
  })

  return loaded.config
}

export async function loadInitxConfig<TConfig>(
  spec: InitxPluginConfigDeclaration<TConfig> | undefined,
  packageName: string,
  cliOptions: Record<string, unknown> = {},
  cwd = process.cwd()
): Promise<LoadedInitxConfig<TConfig>> {
  const options = normalizeOptions(spec, packageName)
  if (!options)
    return { config: undefined }

  const searchCwd = resolve(cwd)
  const formats = options.formats ?? ['ts']
  const explicit = explicitConfigPath(cliOptions[CONFIG_OPTION], searchCwd, formats)

  if (explicit) {
    try {
      return {
        config: await loadExplicitConfig<TConfig>(explicit.path, explicit.format),
        source: explicit.path
      }
    }
    catch (error) {
      if (error instanceof InitxConfigError)
        throw error
      throw new InitxConfigError(`Failed to load initx config ${explicit.path}`)
    }
  }

  try {
    const loaded = await loadConfig<TConfig>({
      cwd: searchCwd,
      stopAt: dirname(searchCwd),
      merge: false,
      defaults: options.defaults,
      sources: configSources(options)
    })

    return {
      config: loaded.config,
      source: loaded.sources[0]
    }
  }
  catch (error) {
    if (error instanceof InitxConfigError)
      throw error
    throw new InitxConfigError('Failed to load initx project config')
  }
}

export async function loadLocalInitxPlugin<TPlugin>(entry: string): Promise<TPlugin> {
  const loaded = await importx<Record<string, unknown>>(entry, import.meta.url)
  const plugin = loaded.default

  if (!plugin)
    throw new Error(`Initx plugin ${entry} does not export a default plugin`)

  return plugin as TPlugin
}
