import { afterEach, describe, expect, it, vi } from 'vitest'

import { inquirer } from '../src/inquirer'

const { promptConfirmMock, promptSelectMock } = vi.hoisted(() => ({
  promptConfirmMock: vi.fn(),
  promptSelectMock: vi.fn()
}))

vi.mock('@inquirer/prompts', () => ({
  confirm: promptConfirmMock,
  select: promptSelectMock
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
})
