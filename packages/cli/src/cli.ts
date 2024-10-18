import cac from 'cac'

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

; (async function () {
  for (const handler of handlers) {
    await handler.run({
      key,
      cliOptions,
      optionsList: Object.keys(cliOptions).filter(key => cliOptions[key] === true).map(key => `--${key}`)
    }, ...others)
  }
})()
