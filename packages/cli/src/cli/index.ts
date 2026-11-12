import type { CliDeps } from './types'
import process from 'node:process'
import { detectManager, installManager, loadPlugins, matchPlugins } from '@initx-plugin/core'
import { inquirer, loadingFunction, logger } from '@initx-plugin/utils'
import pkgJson from '../../package.json'
import { parseCliInput } from './parser'
import { runCli } from './runner'

const defaultDeps: CliDeps = {
  detectManager,
  installManager,
  loadPlugins,
  matchPlugins,
  select: inquirer.select,
  loadingFunction,
  logger
}

export async function runCliFromProcess(argv: string[] = process.argv): Promise<number> {
  const parsed = parseCliInput(argv)

  if (parsed.type === 'help') {
    return 0
  }

  if (parsed.type === 'version') {
    console.log(pkgJson.version)
    return 0
  }

  await runCli(parsed.input, defaultDeps)
  return 0
}

export { createCli, parseCliInput } from './parser'
export { runCli } from './runner'
export type { CliDeps, CliParseResult, ParsedCliInput } from './types'
