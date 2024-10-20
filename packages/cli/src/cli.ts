import cac from 'cac'
import inquirer from 'inquirer'

import type { HandlerInfo } from 'packages/core/src/handler'
import pkgJson from '../package.json'
import { log } from '../../utils/src/log'
import handlers from './handlers'

const cli = cac('initx')

cli
  .help()
  .command('<something>', 'see https://github.com/imba97/initx')
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

const matchedHandlers: HandlerInfo[] = []

for (const handler of handlers) {
  const matched = handler.run({
    key,
    cliOptions,
    optionsList: Object.keys(cliOptions).filter(key => cliOptions[key] === true).map(key => `--${key}`)
  }, ...others)

  matchedHandlers.push(...matched)
}

if (matchedHandlers.length === 0) {
  process.exit(0)
}

; (async function () {
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
      choices: matchedHandlers.map(({ description }, index) => ({
        name: description,
        value: index
      }))
    }
  ])

  await matchedHandlers[index]?.handler()
})()
