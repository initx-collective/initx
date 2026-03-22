import type { NpmPackageInfo } from './types'
import { createRequire } from 'node:module'
import { join } from 'pathe'
import { PLUGIN_DIR, PLUGINS_CACHE_FILE } from '../constants'

const require = createRequire(import.meta.url)
const { pathExists, readJSON, writeJSON } = require('fs-extra')

export class PluginCache {
  private readonly cachePath: string

  constructor(pluginDir: string = PLUGIN_DIR) {
    this.cachePath = join(pluginDir, PLUGINS_CACHE_FILE)
  }

  async read(): Promise<Record<string, NpmPackageInfo>> {
    if (!(await pathExists(this.cachePath)))
      return {}
    return await readJSON(this.cachePath)
  }

  async write(data: Record<string, NpmPackageInfo>): Promise<void> {
    await writeJSON(this.cachePath, data)
  }

  async updateOne(pkg: string, info: NpmPackageInfo): Promise<void> {
    const cache = await this.read()
    cache[pkg] = info
    await this.write(cache)
  }

  async removeOne(pkg: string): Promise<void> {
    const cache = await this.read()
    if (pkg in cache) {
      delete cache[pkg]
      await this.write(cache)
    }
  }

  async rebuild(all: Record<string, NpmPackageInfo>): Promise<void> {
    await this.write(all)
  }
}
