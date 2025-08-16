import { pluginSystem } from './system'

const MANAGER_PLUGIN_NAME = '@initx-plugin/manager'

export async function detectManager() {
  try {
    const plugins = await pluginSystem.list()
    return plugins.some(plugin => plugin.name === MANAGER_PLUGIN_NAME)
  }
  catch {
    return false
  }
}

export async function installManager() {
  await pluginSystem.install(MANAGER_PLUGIN_NAME)
}
