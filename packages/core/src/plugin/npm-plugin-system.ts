import type { PluginInfo, PluginOptions, PluginSystem, SearchResult } from './types'
import { join } from 'pathe'
import { PLUGIN_DIR } from '../constants'
import { NpmManager } from './npm-manager'
import { PluginLoader } from './plugin-loader'
import { isLocalPath } from './utils'

/**
 * NPM-based plugin system using native Node.js APIs
 */
export class NpmPluginSystem<T = any> implements PluginSystem<T> {
  private readonly npmManager: NpmManager
  private readonly pluginLoader: PluginLoader
  private readonly pluginDir: string

  constructor(id: string, options: PluginOptions = {}) {
    this.pluginDir = options.pluginDir ?? PLUGIN_DIR
    this.npmManager = new NpmManager(this.pluginDir, {
      registry: options.registry,
      npmPath: options.npmPath
    })
    this.pluginLoader = new PluginLoader(this.pluginDir)
  }

  async search(keyword: string): Promise<SearchResult[]> {
    return await this.npmManager.search(keyword)
  }

  async install(packageName: string, version?: string): Promise<void> {
    await this.npmManager.install(packageName, version)
  }

  async uninstall(packageName: string): Promise<void> {
    this.pluginLoader.unload(packageName)
    await this.npmManager.uninstall(packageName)
  }

  async list(): Promise<PluginInfo[]> {
    const installed = await this.npmManager.list()
    return Object.entries(installed).map(([name, info]) => ({
      name,
      version: info.version,
      description: info.description,
      isLocal: isLocalPath(info.resolved)
    }))
  }

  async update(packageName: string, version?: string): Promise<void> {
    await this.uninstall(packageName)
    await this.install(packageName, version)
  }

  async load(packageName: string): Promise<T> {
    return await this.pluginLoader.load(packageName)
  }

  resolve(packageName: string, ...paths: string[]): string {
    return join(this.pluginDir, 'node_modules', packageName, ...paths)
  }

  /**
   * Ensure plugin cache is valid. Rebuild if invalid.
   * Call this after updating core packages or if cache was manually deleted.
   */
  async ensureCacheValid(): Promise<void> {
    await this.npmManager.ensureCacheValid()
  }
}
