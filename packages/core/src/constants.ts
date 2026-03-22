import { homedir } from 'node:os'
import fs from 'fs-extra'
import { resolve } from 'pathe'

export const INITX_DIR = resolve(homedir(), '.initx')

export const STORE_DIR = resolve(INITX_DIR, 'stores')
export const STORE_FILE_NAME = 'store.json'

export const PLUGIN_DIR = resolve(INITX_DIR, 'plugins')

export const NODE_MODULES_DIR = fs.existsSync(resolve(PLUGIN_DIR, 'lib'))
  ? 'lib/node_modules'
  : 'node_modules'
