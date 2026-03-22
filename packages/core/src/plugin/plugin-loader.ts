import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { join } from 'pathe'

const require = createRequire(import.meta.url)
const { pathExists, readJSON } = require('fs-extra')

/**
 * Plugin loader using native Node.js ESM import
 *
 * Replaces importx with native import() for better performance and smaller bundle size
 */
export class PluginLoader<T = any> {
  private cache = new Map<string, T>()

  constructor(private pluginDir: string) {}

  async load(packageName: string): Promise<T> {
    // Return cached plugin if already loaded
    if (this.cache.has(packageName)) {
      return this.cache.get(packageName)!
    }

    const packagePath = join(this.pluginDir, 'node_modules', packageName)
    const packageJsonPath = join(packagePath, 'package.json')

    if (!(await pathExists(packageJsonPath))) {
      throw new Error(`Plugin package not found: ${packageName}`)
    }

    const packageJson = await readJSON(packageJsonPath)
    const entryPath = join(packagePath, packageJson.main || 'index.js')

    try {
      // Use native import() for ESM modules
      // Convert file path to file:// URL for Windows compatibility
      const entryUrl = pathToFileURL(entryPath).href
      const module = await import(entryUrl)

      // Get default export or the module itself
      const PluginClass = (module as { default?: T }).default ?? module

      if (typeof PluginClass !== 'function') {
        throw new TypeError('Plugin must export a class or function')
      }

      this.cache.set(packageName, PluginClass)
      return PluginClass
    }
    catch (error: any) {
      throw new Error(`Failed to load plugin ${packageName}: ${error.message}`)
    }
  }

  unload(packageName: string): boolean {
    return this.cache.delete(packageName)
  }

  clearCache(): void {
    this.cache.clear()
  }

  getLoadedPlugins(): string[] {
    return Array.from(this.cache.keys())
  }
}
