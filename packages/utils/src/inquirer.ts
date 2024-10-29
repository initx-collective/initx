import _inquirer from 'inquirer'
import type { SelectOptions } from './types'

async function confirm(message: string) {
  const { result } = await _inquirer.prompt([
    {
      type: 'confirm',
      name: 'result',
      message
    }
  ])

  return result
}

async function select(message: string, options: SelectOptions) {
  const { result } = await _inquirer.prompt([
    {
      type: 'list',
      name: 'result',
      message,
      choices: options.map((option, index) => {
        return typeof option === 'string'
          ? {
              name: option,
              value: index
            }
          : option
      })
    }
  ])

  return result
}

export const inquirer = {
  confirm,
  select
}
