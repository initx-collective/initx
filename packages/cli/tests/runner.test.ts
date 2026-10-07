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

  it('logs error and skips work when key is not a string', async () => {
    const deps = createDeps()

    await runCli({
      key: 42 as unknown as string,
      others: [],
      cliOptions: {}
    }, deps)

    expect(deps.logger.error).toHaveBeenCalledWith('Please enter something')
    expect(deps.detectManager).not.toHaveBeenCalled()
    expect(deps.loadPlugins).not.toHaveBeenCalled()
  })

  it('switches logger to debug level when --debug is passed', async () => {
    const deps = createDeps({
      matchPlugins: vi.fn().mockResolvedValue([])
    })

    await runCli({
      key: 'build',
      others: [],
      cliOptions: {
        debug: true
      }
    }, deps)

    expect(deps.logger.setLevel).toHaveBeenCalledWith('debug')
    expect(deps.logger.debug).toHaveBeenCalledWith('Debug mode enabled')
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
            author: 'test',
            isLocal: false
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
            author: 'test',
            isLocal: false
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

  it('skips installManager when manager plugin is already present', async () => {
    const handler = vi.fn().mockResolvedValue(undefined)
    const deps = createDeps({
      detectManager: vi.fn().mockResolvedValue(true),
      loadPlugins: vi.fn().mockResolvedValue([
        {
          packageInfo: {
            root: '/plugin-a',
            name: 'initx-plugin-a',
            version: '1.0.0',
            description: 'plugin a',
            author: 'test',
            isLocal: false
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
            author: 'test',
            isLocal: false
          }
        }
      ])
    })

    await runCli({
      key: 'build',
      others: [],
      cliOptions: {}
    }, deps)

    expect(deps.installManager).not.toHaveBeenCalled()
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('logs an error and aborts when no plugins are installed', async () => {
    const deps = createDeps({
      loadPlugins: vi.fn().mockResolvedValue([])
    })

    await runCli({
      key: 'build',
      others: [],
      cliOptions: {}
    }, deps)

    expect(deps.logger.error).toHaveBeenCalledWith('No plugin installed')
    expect(deps.matchPlugins).not.toHaveBeenCalled()
  })

  it('warns when no handler matches the key', async () => {
    const deps = createDeps({
      loadPlugins: vi.fn().mockResolvedValue([
        {
          packageInfo: {
            root: '/plugin-a',
            name: 'initx-plugin-a',
            version: '1.0.0',
            description: 'plugin a',
            author: 'test',
            isLocal: false
          },
          instance: {} as any
        }
      ]),
      matchPlugins: vi.fn().mockResolvedValue([])
    })

    await runCli({
      key: 'unknown',
      others: [],
      cliOptions: {}
    }, deps)

    expect(deps.logger.warn).toHaveBeenCalledWith('No handler found')
    expect(deps.select).not.toHaveBeenCalled()
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
            author: 'test',
            isLocal: false
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
            author: 'test',
            isLocal: false
          }
        },
        {
          description: 'second handler',
          handler: secondHandler,
          packageInfo: {
            root: '/plugin-b',
            name: 'initx-plugin-b',
            version: '1.0.0',
            description: 'plugin b',
            author: 'test',
            isLocal: false
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

  it('strips the initx-plugin prefix when labeling choices', async () => {
    const deps = createDeps({
      loadPlugins: vi.fn().mockResolvedValue([
        {
          packageInfo: {
            root: '/plugin-a',
            name: 'initx-plugin-a',
            version: '1.0.0',
            description: 'a',
            author: 'test',
            isLocal: false
          },
          instance: {} as any
        }
      ]),
      matchPlugins: vi.fn().mockResolvedValue([
        {
          description: 'one',
          handler: vi.fn(),
          packageInfo: {
            root: '/plugin-a',
            name: 'initx-plugin-a',
            version: '1.0.0',
            description: 'a',
            author: 'test',
            isLocal: false
          }
        },
        {
          description: 'two',
          handler: vi.fn(),
          packageInfo: {
            root: '/scoped',
            name: '@initx-plugin/scoped',
            version: '1.0.0',
            description: 'scoped',
            author: 'test',
            isLocal: false
          }
        }
      ]),
      select: vi.fn().mockResolvedValue(0)
    })

    await runCli({
      key: 'x',
      others: [],
      cliOptions: {}
    }, deps)

    expect(deps.select).toHaveBeenCalledWith(
      'Which handler do you want to run?',
      ['[a] one', '[scoped] two']
    )
  })

  it('errors when the selected index does not have a handler', async () => {
    const deps = createDeps({
      loadPlugins: vi.fn().mockResolvedValue([
        {
          packageInfo: {
            root: '/plugin-a',
            name: 'initx-plugin-a',
            version: '1.0.0',
            description: 'a',
            author: 'test',
            isLocal: false
          },
          instance: {} as any
        }
      ]),
      matchPlugins: vi.fn().mockResolvedValue([
        {
          description: 'one',
          handler: vi.fn(),
          packageInfo: {
            root: '/plugin-a',
            name: 'initx-plugin-a',
            version: '1.0.0',
            description: 'a',
            author: 'test',
            isLocal: false
          }
        },
        {
          description: 'two',
          handler: vi.fn(),
          packageInfo: {
            root: '/plugin-b',
            name: 'initx-plugin-b',
            version: '1.0.0',
            description: 'b',
            author: 'test',
            isLocal: false
          }
        }
      ]),
      select: vi.fn().mockResolvedValue(99)
    })

    await runCli({
      key: 'x',
      others: [],
      cliOptions: {}
    }, deps)

    expect(deps.logger.error).toHaveBeenCalledWith('Handler not found')
  })

  it('builds optionsList only from boolean-true flags', async () => {
    const handler = vi.fn()
    const deps = createDeps({
      loadPlugins: vi.fn().mockResolvedValue([
        {
          packageInfo: {
            root: '/plugin-a',
            name: 'initx-plugin-a',
            version: '1.0.0',
            description: 'a',
            author: 'test',
            isLocal: false
          },
          instance: {} as any
        }
      ]),
      matchPlugins: vi.fn().mockResolvedValue([
        {
          description: 'handler',
          handler,
          packageInfo: {
            root: '/plugin-a',
            name: 'initx-plugin-a',
            version: '1.0.0',
            description: 'a',
            author: 'test',
            isLocal: false
          }
        }
      ])
    })

    await runCli({
      key: 'build',
      others: [],
      cliOptions: {
        debug: true,
        // falsy values should be filtered out
        dryRun: false,
        force: undefined,
        // non-boolean truthy values should also be filtered
        config: 'something'
      }
    }, deps)

    expect(deps.matchPlugins).toHaveBeenCalledWith(
      expect.any(Array),
      {
        key: 'build',
        cliOptions: {
          debug: true,
          dryRun: false,
          force: undefined,
          config: 'something'
        },
        optionsList: ['--debug']
      }
    )
  })
})
