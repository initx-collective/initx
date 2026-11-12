import type { CliParseResult } from './types'
import cac from 'cac'

export function createCli() {
  const cli = cac('initx')

  cli
    .help()
    .command('<something>', 'see https://github.com/initx-collective/initx')
    .usage('')
    .option('-v, --version', 'Display version number')
    .option('-d, --debug', 'Debug mode')
    .option('-y, --yes', 'Assume yes and skip interactive confirmations')

  return cli
}

export function parseCliInput(argv: string[]): CliParseResult {
  const cli = createCli()
  const { args, options: cliOptions } = cli.parse(argv)

  if (cliOptions.h || cliOptions.help) {
    return {
      type: 'help'
    }
  }

  if (cliOptions.v || cliOptions.version) {
    return {
      type: 'version'
    }
  }

  const [key, ...others] = args

  return {
    type: 'run',
    input: {
      key,
      others,
      cliOptions
    }
  }
}
