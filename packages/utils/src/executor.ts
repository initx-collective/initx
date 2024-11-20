import ora from 'ora'
import { x } from 'tinyexec'

import { where } from './which'

interface Result {
  success: boolean
  content: string
}

export async function c(command: string, options?: string[], execaOptions: Record<string, any> = {}): Promise<Result> {
  const result: Result = {
    success: false,
    content: 'Unknown error'
  }

  try {
    where(command)
    const xResult = await x(command, options, execaOptions)

    result.success = xResult.exitCode === 0
    result.content = (result.success ? xResult.stdout : xResult.stderr).trim()
  }
  catch (e) {
    if ((e as Error).message && (e as Error).message.startsWith('not found')) {
      result.content = `can not find command: ${command}`
    }
    else {
      result.content = (e as Error).message
    }
  }

  return result
}

export async function loadingFunction<T>(message: string, fn: () => Promise<T>) {
  const spinner = ora(message).start()

  return fn().finally(() => {
    spinner.stop()
  })
}
