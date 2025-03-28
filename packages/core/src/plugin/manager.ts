import { c } from '@initx-plugin/utils'
import fs from 'fs-extra'
import { resolve } from 'pathe'
import { NODE_MODULES_DIR, PLUGIN_DIR } from '../constants'
import { withPluginPrefix } from './utils'

const MANAGER_PLUGIN_NAME = '@initx-plugin/manager'

export function detectManager() {
  return fs.existsSync(
    resolve(PLUGIN_DIR, NODE_MODULES_DIR, MANAGER_PLUGIN_NAME)
  )

  // TODO: check version, not needed at present.
}

export async function installManager() {
  await c('npm', withPluginPrefix(['install', MANAGER_PLUGIN_NAME]))
}
