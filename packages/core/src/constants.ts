import { homedir, platform } from 'node:os'
import { resolve } from 'pathe'

const IS_WINDOWS = platform() === 'win32'

export const INITX_DIR = resolve(homedir(), '.initx')

export const STORE_DIR = resolve(INITX_DIR, 'stores')
export const STORE_FILE_NAME = 'store.json'

export const PLUGIN_DIR = resolve(INITX_DIR, 'plugins')

export const NODE_MODULES_DIR = IS_WINDOWS ? 'node_modules' : 'lib/node_modules'
