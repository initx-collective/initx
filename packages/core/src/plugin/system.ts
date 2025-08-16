import type { InitxPlugin } from './abstract'
import { createNpmPlugin } from 'npm-plugin-kit'
import { PLUGIN_DIR } from '../constants'

type Constructor<T> = new (...args: any[]) => T

export const pluginSystem = createNpmPlugin<Constructor<InitxPlugin>>('initx', {
  pluginDir: PLUGIN_DIR
})
