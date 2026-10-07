import { afterEach, describe, expect, it, vi } from 'vitest'

import { inOptional, matchPlugins } from '../src/plugin/utils'

const { pluginSystemListMock, pluginSystemLoadMock } = vi.hoisted(() => ({
  pluginSystemListMock: vi.fn(),
  pluginSystemLoadMock: vi.fn()
}))

vi.mock('../src/plugin/system', () => ({
  pluginSystem: {
    list: pluginSystemListMock,
    load: pluginSystemLoadMock
  }
}))

describe('inOptional', () => {
  it('returns true when a string matches one of the values', () => {
    expect(inOptional(['build', 'dev'], 'build')).toBe(true)
    expect(inOptional(['build', 'dev'], 'dev')).toBe(true)
  })

  it('returns true when a regex matches the value', () => {
    expect(inOptional([/^feat:/], 'feat:test')).toBe(true)
    expect(inOptional([/^fix\(\d+\)/], 'fix(123)')).toBe(true)
  })

  it('treats an `undefined` slot as a wildcard', () => {
    expect(inOptional([undefined], undefined as unknown as string)).toBe(true)
    expect(inOptional([undefined], 'any-value')).toBe(false)
  })

  it('returns false when no rule matches', () => {
    expect(inOptional(['release'], 'dev')).toBe(false)
    expect(inOptional([/^feat/], 'fix:foo')).toBe(false)
  })

  it('returns true when any of multiple rules match (string | regex)', () => {
    expect(inOptional(['dev', /^feat/], 'feat:bar')).toBe(true)
    expect(inOptional(['dev', /^feat/], 'dev')).toBe(true)
    expect(inOptional(['dev', /^feat/], 'release')).toBe(false)
  })

  it('returns false for an empty rule list', () => {
    expect(inOptional([], 'dev')).toBe(false)
  })
})

describe('matchPlugins', () => {
  it('builds matched handlers with package info and filtered options', async () => {
    const handler = vi.fn()
    const run = vi.fn().mockResolvedValue([
      {
        description: 'run handler',
        handler
      }
    ])

    const matched = await matchPlugins([
      {
        packageInfo: {
          root: '/plugin-a',
          name: 'initx-plugin-a',
          version: '1.0.0',
          description: 'plugin a',
          author: 'test',
          isLocal: false
        },
        instance: {
          run
        } as any
      }
    ], {
      key: 'build',
      cliOptions: {
        debug: true,
        dryRun: false,
        force: true
      },
      optionsList: ['--debug', '--force']
    }, 'dev')

    expect(run).toHaveBeenCalledWith({
      key: 'build',
      cliOptions: {
        debug: true,
        dryRun: false,
        force: true
      },
      packageInfo: {
        root: '/plugin-a',
        name: 'initx-plugin-a',
        version: '1.0.0',
        description: 'plugin a',
        author: 'test',
        isLocal: false
      },
      optionsList: ['--debug', '--force']
    }, 'dev')

    expect(matched).toEqual([
      {
        description: 'run handler',
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

  it('aggregates handlers from multiple plugins', async () => {
    const runA = vi.fn().mockResolvedValue([
      {
        description: 'a',
        handler: vi.fn()
      }
    ])
    const runB = vi.fn().mockResolvedValue([
      {
        description: 'b',
        handler: vi.fn()
      },
      {
        description: 'b2',
        handler: vi.fn()
      }
    ])

    const matched = await matchPlugins([
      {
        packageInfo: {
          root: '/plugin-a',
          name: 'initx-plugin-a',
          version: '1.0.0',
          description: 'a',
          author: 'a',
          isLocal: false
        },
        instance: { run: runA } as any
      },
      {
        packageInfo: {
          root: '/plugin-b',
          name: 'initx-plugin-b',
          version: '2.0.0',
          description: 'b',
          author: 'b',
          isLocal: true
        },
        instance: { run: runB } as any
      }
    ], {
      key: 'lint',
      cliOptions: {},
      optionsList: []
    })

    expect(runA).toHaveBeenCalledTimes(1)
    expect(runB).toHaveBeenCalledTimes(1)
    expect(matched.map(m => m.description)).toEqual(['a', 'b', 'b2'])
    expect(matched.map(m => m.packageInfo.name)).toEqual([
      'initx-plugin-a',
      'initx-plugin-b',
      'initx-plugin-b'
    ])
  })

  it('returns an empty list when no plugin matches', async () => {
    const matched = await matchPlugins([], {
      key: 'noop',
      cliOptions: {},
      optionsList: []
    })

    expect(matched).toEqual([])
  })
})

describe('fetchPlugins', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('filters out non-initx plugins and core/utils packages', async () => {
    pluginSystemListMock.mockResolvedValueOnce([
      {
        name: '@initx-plugin/manager',
        packageInfo: {
          version: '1.0.0',
          description: 'manager plugin',
          author: { name: 'tester' }
        },
        plugin: {
          root: '/manager',
          isLocal: false
        }
      },
      {
        name: '@initx-plugin/git',
        packageInfo: {
          version: '0.5.0',
          description: 'git plugin',
          author: 'tester',
          homepage: 'https://example.com'
        },
        plugin: {
          root: '/git',
          isLocal: false
        }
      },
      {
        name: '@initx-plugin/core',
        packageInfo: {
          version: '0.0.0',
          description: 'core',
          author: ''
        },
        plugin: {
          root: '/core',
          isLocal: true
        }
      },
      {
        name: 'not-an-initx-plugin',
        packageInfo: {
          version: '1.0.0',
          description: 'no',
          author: ''
        },
        plugin: {
          root: '/no',
          isLocal: false
        }
      }
    ])

    const { fetchPlugins } = await import('../src/plugin/utils')
    const plugins = await fetchPlugins()

    expect(plugins.map(p => p.name)).toEqual([
      '@initx-plugin/manager',
      '@initx-plugin/git'
    ])
    expect(plugins[0]).toMatchObject({
      name: '@initx-plugin/manager',
      version: '1.0.0',
      description: 'manager plugin',
      root: '/manager',
      isLocal: false
    })
    expect(plugins[1]).toMatchObject({
      name: '@initx-plugin/git',
      homepage: 'https://example.com'
    })
  })

  it('propagates errors from the underlying plugin list', async () => {
    pluginSystemListMock.mockRejectedValueOnce(new Error('network down'))

    const { fetchPlugins } = await import('../src/plugin/utils')

    await expect(fetchPlugins()).rejects.toThrow('network down')
  })
})
