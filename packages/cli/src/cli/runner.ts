import type { InitxBaseContext } from '@initx-plugin/core'
import type { CliDeps, ParsedCliInput } from './types'

const PLUGIN_NAME_RE = /^@?initx-plugin[-/]/

function toOptionsList(cliOptions: Record<string, any>): string[] {
  return Object.keys(cliOptions)
    .filter(key => cliOptions[key] === true)
    .map(key => `--${key}`)
}

export async function runCli(input: ParsedCliInput, deps: CliDeps): Promise<void> {
  const {
    detectManager,
    installManager,
    loadPlugins,
    loadingFunction,
    logger,
    matchPlugins,
    select
  } = deps

  const { key, others, cliOptions } = input
  const yes = Boolean(cliOptions.y || cliOptions.yes)
  const runLoading = <T>(message: string, fn: () => Promise<T>): Promise<T> => {
    if (yes)
      return fn()

    return loadingFunction(message, fn)
  }

  if (cliOptions.d || cliOptions.debug) {
    logger.setLevel('debug')
    logger.debug('Debug mode enabled')
  }

  if (!key || typeof key !== 'string') {
    logger.error('Please enter something')
    return
  }

  logger.debug(`Input: ${key}`)

  let installedManager = false

  await runLoading('initx', async () => {
    installedManager = await detectManager()
  })

  logger.debug(`Manager: ${installedManager ? 'installed' : 'not found'}`)

  if (!installedManager) {
    await runLoading('Installing manager plugin', installManager)
  }

  const plugins = await runLoading('Loading plugins', loadPlugins)

  if (plugins.length === 0) {
    logger.error('No plugin installed')
    return
  }

  logger.debug(`Loaded ${plugins.length} plugins`)

  const ctx: InitxBaseContext = {
    key,
    cliOptions,
    optionsList: toOptionsList(cliOptions)
  }

  const matchedHandlers = await matchPlugins(plugins, ctx, ...others)

  logger.debug(`Matched ${matchedHandlers.length} handlers`)

  if (matchedHandlers.length === 0) {
    logger.warn('No handler found')
    return
  }

  if (matchedHandlers.length === 1) {
    const [{ handler, description }] = matchedHandlers
    logger.debug(`Running: ${description}`)
    await handler()
    return
  }

  if (yes) {
    logger.error('Multiple handlers found, please specify one')
    return
  }

  const index = await select(
    'Which handler do you want to run?',
    matchedHandlers.map(
      ({ description, packageInfo }) => `[${packageInfo.name.replace(PLUGIN_NAME_RE, '')}] ${description}`
    )
  )

  if (!matchedHandlers[index] || typeof matchedHandlers[index].handler !== 'function') {
    logger.error('Handler not found')
    return
  }

  const { handler, description } = matchedHandlers[index]
  logger.debug(`Running: ${description}`)
  await handler()
}
