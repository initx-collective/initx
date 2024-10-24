import path from 'node:path'
import { c } from '@initx-plugin/utils'
import { readdirSync } from 'fs-extra'
import type { InitxHandler } from './handler'

type Constructor<T> = new (...args: any[]) => T

export async function loadPlugins(): Promise<InitxHandler[]> {
  const { stdout: npmPath } = await c('npm', ['config', 'get', 'prefix'])
  const nodeModules = path.join(npmPath as string, 'node_modules')
  const pluginsName = readdirSync(nodeModules).filter(name => /^(?:@initx-plugin\/|initx-plugin-)/.test(name))
  const pluginsModule: Constructor<InitxHandler>[] = await Promise.all(pluginsName.map(dirname => import(path.join(nodeModules, dirname))))
  return pluginsModule.map(InitHandlerClass => new InitHandlerClass())
}
