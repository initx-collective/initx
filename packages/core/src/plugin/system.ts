import type { InitxPlugin } from './abstract'
import { createNpmPlugin } from 'npm-plugin-kit'
import { PLUGIN_DIR } from '../constants'

type Constructor<T> = new (...args: any[]) => T

export interface InitxPluginExtra {
  homepage?: string
}

export const pluginSystem = createNpmPlugin<Constructor<InitxPlugin>, InitxPluginExtra>('initx', {
  pluginDir: PLUGIN_DIR,
  cacheFields: ['homepage']
})
