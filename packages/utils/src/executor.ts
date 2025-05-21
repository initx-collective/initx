import ora from 'ora'
import { x } from 'tinyexec'

import { where } from './which'

interface Result {
  success: boolean
  content: string
}

const detectedCommands = new Map<string, boolean>()

export async function c(command: string, options?: string[], execaOptions: Record<string, any> = {}): Promise<Result> {
  const result: Result = {
    success: false,
    content: 'Unknown error'
  }

  try {
    const hasCommand = detectCommand(command)

    if (!hasCommand) {
      result.content = `Can not find command: ${command}`
      return result
    }

    const xResult = await x(command, options, execaOptions)

    result.success = xResult.exitCode === 0
    result.content = (result.success ? xResult.stdout : xResult.stderr).trim()
  }
  catch (e) {
    result.content = (e as Error).message
  }

  return result
}

export async function loadingFunction<T>(message: string, fn: () => Promise<T>) {
  const spinner = ora(message).start()

  return fn().finally(() => {
    spinner.stop()
  })
}

function detectCommand(command: string): boolean {
  if (detectedCommands.has(command)) {
    return detectedCommands.get(command)!
  }

  let result: boolean

  try {
    where(command)
    result = true
  }
  // eslint-disable-next-line unused-imports/no-unused-vars
  catch (e) {
    result = false
  }

  detectedCommands.set(command, result)
  return result
}
