import type { InitxBaseContext } from '@initx-plugin/core'
import process from 'node:process'
import { loadPlugins, matchPlugins } from '@initx-plugin/core'
import { inquirer, loadingFunction, log } from '@initx-plugin/utils'

import cac from 'cac'

import pkgJson from '../package.json'

const cli = cac('initx')

cli
  .help()
  .command('<something>', 'see https://github.com/initx-collective/initx')
  .usage('')
  .option('-v, --version', 'Display version number')

const { args, options: cliOptions } = cli.parse()

if (cliOptions.h || cliOptions.help) {
  process.exit(0)
}

if (cliOptions.v || cliOptions.version) {
  console.log(pkgJson.version)
  process.exit(0)
}

const [key, ...others] = args

if (!key || typeof key !== 'string') {
  log.error('Please enter something')
  process.exit(0)
}

; (async function () {
  const plugins = await loadingFunction('Loading plugins', loadPlugins)

  if (plugins.length === 0) {
    log.error('No plugin installed')
    process.exit(0)
  }

  const ctx: InitxBaseContext = {
    key,
    cliOptions,
    optionsList: Object.keys(cliOptions).filter(key => cliOptions[key] === true).map(key => `--${key}`)
  }

  const matchedHandlers = await matchPlugins(plugins, ctx, ...others)

  if (matchedHandlers.length === 0) {
    log.warn('No handler found')
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
      ({ description, packageInfo }) => `[${packageInfo.name.replace(/^@?initx-plugin[-/]/, '')}] ${description}`
    )
  )

  if (!matchedHandlers[index] || typeof matchedHandlers[index].handler !== 'function') {
    log.error('Handler not found')
    process.exit(0)
  }

  await matchedHandlers[index].handler()
})()
