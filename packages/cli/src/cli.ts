import cac from 'cac'

import pkgJson from '../package.json'
import { log } from '../../utils/src/log'
import handlers from './handlers'

const cli = cac('initx')

cli
  .help()
  .command('<something>', 'Enter something')
  .usage('')
  .option('-v, --version', 'Display version number')

const { args, options } = cli.parse()

if (options.h || options.help) {
  process.exit(0)
}

if (options.v || options.version) {
  console.log(pkgJson.version)
  process.exit(0)
}

const [something, ...rest] = args

if (!something || typeof something !== 'string') {
  log.error('Please enter something')
  process.exit(0)
}

; (async function () {
  for (const handler of handlers) {
    await handler.run(something, ...rest)
  }
})()
