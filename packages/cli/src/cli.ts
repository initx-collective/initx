import type { InitxBaseContext } from '@initx-plugin/core'
import process from 'node:process'
import { detectManager, installManager, loadPlugins, matchPlugins } from '@initx-plugin/core'
import { inquirer, loadingFunction, logger } from '@initx-plugin/utils'
import cac from 'cac'
import pkgJson from '../package.json'

const PLUGIN_NAME_RE = /^@?initx-plugin[-/]/
const cli = cac('initx')

cli
  .help()
  .command('<something>', 'see https://github.com/initx-collective/initx')
  .usage('')
  .option('-v, --version', 'Display version number')
  .option('-d, --debug', 'Debug mode')

const { args, options: cliOptions } = cli.parse()

if (cliOptions.h || cliOptions.help) {
  process.exit(0)
}

if (cliOptions.v || cliOptions.version) {
  console.log(pkgJson.version)
  process.exit(0)
}

if (cliOptions.d || cliOptions.debug) {
  logger.setLevel('debug')
  logger.debug('Debug mode enabled')
}

const [key, ...others] = args

if (!key || typeof key !== 'string') {
  logger.error('Please enter something')
  process.exit(0)
}

; (async function () {
  let installedManager

  await loadingFunction('initx', async () => {
    installedManager = await detectManager()
  })

  if (!installedManager) {
    await loadingFunction('Installing manager plugin', installManager)
  }

  const plugins = await loadingFunction('Loading plugins', loadPlugins)

  if (plugins.length === 0) {
    logger.error('No plugin installed')
    process.exit(0)
  }

  const ctx: InitxBaseContext = {
    key,
    cliOptions,
    optionsList: Object.keys(cliOptions).filter(key => cliOptions[key] === true).map(key => `--${key}`)
  }

  const matchedHandlers = await matchPlugins(plugins, ctx, ...others)

  if (matchedHandlers.length === 0) {
    logger.warn('No handler found')
    process.exit(0)
  }

  if (matchedHandlers.length === 1) {
    const [{ handler }] = matchedHandlers
    await handler()
    process.exit(0)
  }

  const index = await inquirer.select(
    'Which handler do you want to run?',
    matchedHandlers.map(
      ({ description, packageInfo }) => `[${packageInfo.name.replace(PLUGIN_NAME_RE, '')}] ${description}`
    )
  )

  if (!matchedHandlers[index] || typeof matchedHandlers[index].handler !== 'function') {
    logger.error('Handler not found')
    process.exit(0)
  }

  await matchedHandlers[index].handler()
})()
