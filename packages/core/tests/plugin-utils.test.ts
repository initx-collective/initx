import { describe, expect, it, vi } from 'vitest'

import { inOptional, matchPlugins } from '../src/plugin/utils'

describe('plugin utils', () => {
  it('supports string, regexp, and undefined optional rules', () => {
    expect(inOptional(['build', 'dev'], 'build')).toBe(true)
    expect(inOptional([/^feat:/], 'feat:test')).toBe(true)
    expect(inOptional([undefined], undefined as unknown as string)).toBe(true)
    expect(inOptional(['release'], 'dev')).toBe(false)
  })

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
})
