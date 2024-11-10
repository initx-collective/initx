import cac from 'cac'

import { inquirer, log } from '@initx-plugin/utils'
import { loadPlugins, matchPlugins } from '@initx-plugin/core'

import type { InitxBaseContext } from '@initx-plugin/core'

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
  const plugins = await loadPlugins()

  if (plugins.length === 0) {
    log.error('No plugin installed')
    process.exit(0)
  }

  const ctx: InitxBaseContext = {
    key,
    cliOptions,
    optionsList: Object.keys(cliOptions).filter(key => cliOptions[key] === true).map(key => `--${key}`)
  }

  const matchedHandlers = matchPlugins(plugins, ctx, ...others)

  if (matchedHandlers.length === 0) {
    process.exit(0)
  }

  if (matchedHandlers.length === 1) {
    const [{ handler }] = matchedHandlers
    await handler()
    return
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
