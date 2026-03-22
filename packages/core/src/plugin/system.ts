import type { InitxPlugin } from './abstract'
import { PLUGIN_DIR } from '../constants'
import { NpmPluginSystem } from './npm-plugin-system'

type Constructor<T> = new (...args: any[]) => T

/**
 * Create a plugin system instance
 */
export function createNpmPlugin<T = any>(id: string, options?: {
  pluginDir?: string
  registry?: string
  npmPath?: string
}): NpmPluginSystem<T> {
  return new NpmPluginSystem<T>(id, options)
}

/**
 * Global plugin system instance for initx
 */
export const pluginSystem = createNpmPlugin<Constructor<InitxPlugin>>('initx', {
  pluginDir: PLUGIN_DIR
})

export { NpmPluginSystem } from './npm-plugin-system'
// Re-export types
export type { NpmPackageInfo, PluginInfo, PluginOptions, PluginSystem, SearchResult } from './types'
