import { afterEach, describe, expect, it, vi } from 'vitest'

import { inquirer } from '../src/inquirer'

const { promptConfirmMock, promptSelectMock, promptInputMock, promptPasswordMock } = vi.hoisted(() => ({
  promptConfirmMock: vi.fn(),
  promptSelectMock: vi.fn(),
  promptInputMock: vi.fn(),
  promptPasswordMock: vi.fn()
}))

vi.mock('@inquirer/prompts', () => ({
  confirm: promptConfirmMock,
  select: promptSelectMock,
  input: promptInputMock,
  password: promptPasswordMock
}))

afterEach(() => {
  vi.clearAllMocks()
})

describe('inquirer wrapper', () => {
  it('forwards message to confirm prompt', async () => {
    promptConfirmMock.mockResolvedValueOnce(true)

    const result = await inquirer.confirm('Continue?')

    expect(result).toBe(true)
    expect(promptConfirmMock).toHaveBeenCalledWith({
      message: 'Continue?'
    })
  })

  it('maps string options to indexed choices', async () => {
    promptSelectMock.mockResolvedValueOnce(1)

    const result = await inquirer.select('Pick one', ['alpha', 'beta'])

    expect(result).toBe(1)
    expect(promptSelectMock).toHaveBeenCalledWith({
      message: 'Pick one',
      choices: [
        {
          name: 'alpha',
          value: 0
        },
        {
          name: 'beta',
          value: 1
        }
      ]
    })
  })

  it('keeps explicit option values unchanged', async () => {
    promptSelectMock.mockResolvedValueOnce('prod')

    const options = [
      {
        name: 'Development',
        value: 'dev'
      },
      {
        name: 'Production',
        value: 'prod'
      }
    ]

    const result = await inquirer.select('Environment', options)

    expect(result).toBe('prod')
    expect(promptSelectMock).toHaveBeenCalledWith({
      message: 'Environment',
      choices: options
    })
  })

  it('forwards message to input prompt', async () => {
    promptInputMock.mockResolvedValueOnce('hello')

    const result = await inquirer.input('Your name?')

    expect(result).toBe('hello')
    expect(promptInputMock).toHaveBeenCalledWith({
      message: 'Your name?'
    })
  })

  it('forwards default / required / pattern options to input prompt', async () => {
    promptInputMock.mockResolvedValueOnce('abc')

    const pattern = /^abc$/
    await inquirer.input('Token?', {
      default: 'abc',
      required: true,
      pattern,
      patternError: 'must match abc'
    })

    expect(promptInputMock).toHaveBeenCalledWith({
      message: 'Token?',
      default: 'abc',
      required: true,
      pattern,
      patternError: 'must match abc'
    })
  })

  it('converts string pattern into RegExp for input prompt', async () => {
    promptInputMock.mockResolvedValueOnce('abc')

    await inquirer.input('Token?', { pattern: '^abc$' })

    const call = promptInputMock.mock.calls[0]?.[0] as { pattern: RegExp }
    expect(call.pattern).toBeInstanceOf(RegExp)
    expect(call.pattern.source).toBe('^abc$')
  })

  it('skips empty-string defaults so the prompt stays empty', async () => {
    promptInputMock.mockResolvedValueOnce('')

    await inquirer.input('Empty?', { default: '' })

    expect(promptInputMock).toHaveBeenCalledWith({
      message: 'Empty?'
    })
  })

  it('forwards mask and toggle options to password prompt', async () => {
    promptPasswordMock.mockResolvedValueOnce('top-secret')

    const validate = (value: string) => value.length > 0
    const result = await inquirer.password('Token?', {
      mask: '#',
      toggleMask: true,
      validate
    })

    expect(result).toBe('top-secret')
    expect(promptPasswordMock).toHaveBeenCalledWith({
      message: 'Token?',
      mask: '#',
      toggleMask: true,
      validate
    })
  })
})
