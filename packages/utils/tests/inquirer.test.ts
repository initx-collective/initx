import { afterEach, describe, expect, it, vi } from 'vitest'

import { inquirer } from '../src/inquirer'

const { promptConfirmMock, promptSelectMock, promptInputMock, promptPasswordMock, promptSearchMock } = vi.hoisted(() => ({
  promptConfirmMock: vi.fn(),
  promptSelectMock: vi.fn(),
  promptInputMock: vi.fn(),
  promptPasswordMock: vi.fn(),
  promptSearchMock: vi.fn()
}))

vi.mock('@inquirer/prompts', () => ({
  confirm: promptConfirmMock,
  select: promptSelectMock,
  input: promptInputMock,
  password: promptPasswordMock,
  search: promptSearchMock
}))

afterEach(() => {
  vi.clearAllMocks()
})

describe('inquirer wrapper', () => {
  describe('confirm', () => {
    it('forwards message to confirm prompt', async () => {
      promptConfirmMock.mockResolvedValueOnce(true)

      const result = await inquirer.confirm('Continue?')

      expect(result).toBe(true)
      expect(promptConfirmMock).toHaveBeenCalledWith({
        message: 'Continue?'
      })
    })

    it('returns the rejected answer when the user declines', async () => {
      promptConfirmMock.mockResolvedValueOnce(false)

      const result = await inquirer.confirm('Continue?')

      expect(result).toBe(false)
    })
  })

  describe('select', () => {
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

    it('handles an empty string list without crashing', async () => {
      promptSelectMock.mockResolvedValueOnce(undefined)

      await inquirer.select('Empty', [])

      expect(promptSelectMock).toHaveBeenCalledWith({
        message: 'Empty',
        choices: []
      })
    })
  })

  describe('input', () => {
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

    it('forwards validate callbacks as-is', async () => {
      promptInputMock.mockResolvedValueOnce('ok')

      const validate = (value: string) => value.length > 0
      await inquirer.input('Name?', { validate })

      const call = promptInputMock.mock.calls[0]?.[0] as { validate: typeof validate }
      expect(call.validate).toBe(validate)
    })
  })

  describe('password', () => {
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

    it('supports mask: false to disable masking', async () => {
      promptPasswordMock.mockResolvedValueOnce('plain')

      await inquirer.password('Token?', { mask: false })

      const call = promptPasswordMock.mock.calls[0]?.[0] as { mask: boolean }
      expect(call.mask).toBe(false)
    })

    it('forwards only the message when no options are provided', async () => {
      promptPasswordMock.mockResolvedValueOnce('')

      await inquirer.password('Token?')

      expect(promptPasswordMock).toHaveBeenCalledWith({
        message: 'Token?'
      })
    })
  })

  describe('search', () => {
    it('forwards message and filters items via source callback', async () => {
      promptSearchMock.mockImplementationOnce(async config => ((config.source as () => Array<{ name: string, value: string }>)()
        .find(c => c.value === 'mystery')
        ?.value ?? ''))

      const result = await inquirer.search('Pick', ['alpha', 'mystery', 'gamma'])

      expect(result).toBe('mystery')
      const call = promptSearchMock.mock.calls[0]?.[0] as {
        message: string
        source: (term: string) => Array<{ name: string, value: string }>
      }
      expect(call.message).toBe('Pick')
      expect(call.source('my').map(c => c.value)).toEqual(['mystery'])
      expect(call.source('').map(c => c.value)).toEqual(['alpha', 'mystery', 'gamma'])
    })

    it('preserves explicit search choice values', async () => {
      promptSearchMock.mockImplementationOnce(async config => ((config.source as () => Array<{ name: string, value: string }>)()
        .find(c => c.value === 'prod')
        ?.value ?? ''))

      const items = [
        { name: 'Development', value: 'dev' },
        { name: 'Production', value: 'prod' }
      ]
      const result = await inquirer.search('Env', items)

      expect(result).toBe('prod')
    })

    it('forwards pageSize and initialValue to search prompt', async () => {
      promptSearchMock.mockResolvedValueOnce('alpha')

      await inquirer.search('Pick', ['alpha', 'beta'], { pageSize: 5, initialValue: 'al' })

      expect(promptSearchMock).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Pick',
        pageSize: 5,
        initialValue: 'al'
      }))
    })
  })
})
