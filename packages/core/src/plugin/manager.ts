import { c } from '@initx-plugin/utils'
import { existsSync } from 'fs-extra'
import { resolve } from 'pathe'
import { NODE_MODULES_DIR, PLUGIN_DIR } from '../constants'

const MANAGER_PLUGIN_NAME = '@initx-plugin/manager'

function detectManager() {
  return existsSync(
    resolve(PLUGIN_DIR, NODE_MODULES_DIR, MANAGER_PLUGIN_NAME)
  )

  // TODO: check version, not needed at present.
}

export async function installManager() {
  if (detectManager()) {
    return
  }

  await c('npm', ['install', '-g', MANAGER_PLUGIN_NAME, '--prefix', PLUGIN_DIR])
}
