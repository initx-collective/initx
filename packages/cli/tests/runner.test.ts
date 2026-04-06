import type { CliDeps } from '../src/cli/index'
import { describe, expect, it, vi } from 'vitest'
import { runCli } from '../src/cli/index'

function createDeps(overrides: Partial<CliDeps> = {}): CliDeps {
  return {
    detectManager: vi.fn().mockResolvedValue(true),
    installManager: vi.fn().mockResolvedValue(undefined),
    loadPlugins: vi.fn().mockResolvedValue([]),
    matchPlugins: vi.fn().mockResolvedValue([]),
    select: vi.fn().mockResolvedValue(0),
    loadingFunction: vi.fn(async (_message, fn) => fn()),
    logger: {
      setLevel: vi.fn(),
      debug: vi.fn(),
      info: vi.fn(),
      success: vi.fn(),
      warn: vi.fn(),
      error: vi.fn()
    },
    ...overrides
  }
}

describe('runCli', () => {
  it('logs error when key is missing', async () => {
    const deps = createDeps()

    await runCli({
      key: undefined,
      others: [],
      cliOptions: {}
    }, deps)

    expect(deps.logger.error).toHaveBeenCalledWith('Please enter something')
    expect(deps.loadPlugins).not.toHaveBeenCalled()
  })

  it('installs manager when not found and runs single handler', async () => {
    const handler = vi.fn().mockResolvedValue(undefined)
    const deps = createDeps({
      detectManager: vi.fn().mockResolvedValue(false),
      loadPlugins: vi.fn().mockResolvedValue([
        {
          packageInfo: {
            root: '/plugin-a',
            name: 'initx-plugin-a',
            version: '1.0.0',
            description: 'plugin a',
            author: 'test'
          },
          instance: {} as any
        }
      ]),
      matchPlugins: vi.fn().mockResolvedValue([
        {
          description: 'build handler',
          handler,
          packageInfo: {
            root: '/plugin-a',
            name: 'initx-plugin-a',
            version: '1.0.0',
            description: 'plugin a',
            author: 'test'
          }
        }
      ])
    })

    await runCli({
      key: 'build',
      others: ['dev'],
      cliOptions: {
        debug: true,
        force: true
      }
    }, deps)

    expect(deps.installManager).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledTimes(1)
    expect(deps.matchPlugins).toHaveBeenCalledWith(
      expect.any(Array),
      {
        key: 'build',
        cliOptions: {
          debug: true,
          force: true
        },
        optionsList: ['--debug', '--force']
      },
      'dev'
    )
  })

  it('asks user to choose when multiple handlers are matched', async () => {
    const firstHandler = vi.fn().mockResolvedValue(undefined)
    const secondHandler = vi.fn().mockResolvedValue(undefined)

    const deps = createDeps({
      loadPlugins: vi.fn().mockResolvedValue([
        {
          packageInfo: {
            root: '/plugin-a',
            name: 'initx-plugin-a',
            version: '1.0.0',
            description: 'plugin a',
            author: 'test'
          },
          instance: {} as any
        }
      ]),
      matchPlugins: vi.fn().mockResolvedValue([
        {
          description: 'first handler',
          handler: firstHandler,
          packageInfo: {
            root: '/plugin-a',
            name: 'initx-plugin-a',
            version: '1.0.0',
            description: 'plugin a',
            author: 'test'
          }
        },
        {
          description: 'second handler',
          handler: secondHandler,
          packageInfo: {
            root: '/plugin-a',
            name: 'initx-plugin-b',
            version: '1.0.0',
            description: 'plugin b',
            author: 'test'
          }
        }
      ]),
      select: vi.fn().mockResolvedValue(1)
    })

    await runCli({
      key: 'build',
      others: [],
      cliOptions: {}
    }, deps)

    expect(deps.select).toHaveBeenCalledWith(
      'Which handler do you want to run?',
      ['[a] first handler', '[b] second handler']
    )
    expect(firstHandler).not.toHaveBeenCalled()
    expect(secondHandler).toHaveBeenCalledTimes(1)
  })
})
