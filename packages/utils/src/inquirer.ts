import type { SelectOptions, SelectReturn } from './types'

import { confirm as promptConfirm, input as promptInput, password as promptPassword, select as promptSelect } from '@inquirer/prompts'

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

export interface InputOptions {
  /** Shown to the user as the existing value (placeholder / prefill). Empty string is ignored. */
  default?: string
  /** Treat the input as required; the user cannot submit an empty value. */
  required?: boolean
  /** Pattern that the submitted value must match (string representation accepted). */
  pattern?: RegExp | string
  /** Custom validator; return true to accept, a string to show as an error. */
  validate?: (value: string) => boolean | string | Promise<boolean | string>
  /** Hint message shown when `pattern` fails. */
  patternError?: string
}

async function input(
  message: string,
  options?: InputOptions
): Promise<string> {
  return promptInput({
    message,
    ...(options?.default ? { default: options.default } : {}),
    ...(options?.required !== undefined ? { required: options.required } : {}),
    ...(options?.pattern !== undefined
      ? { pattern: typeof options.pattern === 'string' ? new RegExp(options.pattern) : options.pattern }
      : {}),
    ...(options?.validate ? { validate: options.validate } : {}),
    ...(options?.patternError ? { patternError: options.patternError } : {})
  })
}

export interface PasswordOptions {
  /** Replace typed characters with this mask character; pass `false` to disable masking. */
  mask?: boolean | string
  /** Allow toggling mask visibility with a hotkey. */
  toggleMask?: boolean
  /** Custom validator; return true to accept, a string to show as an error. */
  validate?: (value: string) => boolean | string | Promise<boolean | string>
}

async function password(
  message: string,
  options?: PasswordOptions
): Promise<string> {
  return promptPassword({
    message,
    ...(options?.mask !== undefined ? { mask: options.mask } : {}),
    ...(options?.toggleMask !== undefined ? { toggleMask: options.toggleMask } : {}),
    ...(options?.validate ? { validate: options.validate } : {})
  })
}

export const inquirer = {
  confirm,
  input,
  password,
  select
}
