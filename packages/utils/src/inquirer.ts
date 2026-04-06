import type { SelectOptions, SelectReturn } from './types'

import { confirm as promptConfirm, select as promptSelect } from '@inquirer/prompts'

async function confirm(message: string): Promise<boolean> {
  return promptConfirm({
    message
  })
}

async function select<T extends SelectOptions>(
  message: string,
  options: T
): Promise<SelectReturn<T>> {
  return promptSelect({
    message,
    choices: options.map((option, index) => {
      return typeof option === 'string'
        ? {
            name: option,
            value: index
          }
        : option
    })
  }) as Promise<SelectReturn<T>>
}

export const inquirer = {
  confirm,
  select
}
