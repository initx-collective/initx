import cac from 'cac'
import inquirer from 'inquirer'

import { log } from '@initx-plugin/utils'
import { loadPlugins } from '@initx-plugin/core'
import type { HandlerInfo, PackageInfo } from '@initx-plugin/core'

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

  const matchedHandlers: (HandlerInfo & {
    packageInfo: PackageInfo
  })[] = []

  for (const plugin of plugins) {
    const { handler, packageInfo } = plugin

    const matched = handler.run({
      key,
      cliOptions,
      optionsList: Object.keys(cliOptions).filter(key => cliOptions[key] === true).map(key => `--${key}`)
    }, ...others)

    matchedHandlers.push(...matched.map(item => ({
      handler: item.handler,
      description: item.description,
      packageInfo
    })))
  }

  if (matchedHandlers.length === 0) {
    process.exit(0)
  }

  if (matchedHandlers.length === 1) {
    const [{ handler }] = matchedHandlers
    await handler()
    return
  }

  const { index } = await inquirer.prompt([
    {
      type: 'list',
      name: 'index',
      message: 'Which handler do you want to run?',
      choices: matchedHandlers.map(({ description, packageInfo }, index) => ({
        name: `[${packageInfo.name.replace(/^@?initx-plugin[-/]/, '')}] ${description}`,
        value: index
      }))
    }
  ])

  if (!matchedHandlers[index] || typeof matchedHandlers[index].handler !== 'function') {
    log.error('Handler not found')
    process.exit(0)
  }

  await matchedHandlers[index].handler()
})()
