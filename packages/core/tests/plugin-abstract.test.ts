import type { InitxContext, InitxMatcherRules, InitxRunContext } from '../src/plugin/abstract'

import { describe, expect, it, vi } from 'vitest'
import { InitxPlugin } from '../src/plugin/abstract'

const { createStoreMock, writeStoreMock } = vi.hoisted(() => ({
  createStoreMock: vi.fn(() => ({ handled: false })),
  writeStoreMock: vi.fn()
}))

vi.mock('../src/store', () => ({
  createStore: createStoreMock,
  writeStore: writeStoreMock
}))

class TestPlugin extends InitxPlugin<{ handled: boolean }> {
  rules: InitxMatcherRules = [
    {
      matching: 'build',
      description: 'build handler',
      optional: ['dev'],
      verify: ({ key }, mode) => key === 'build' && mode === 'dev'
    }
  ]

  public received: Array<{ context: InitxContext<{ handled: boolean }>, others: string[] }> = []

  defaultStore = {
    handled: false
  }

  async handle(context: InitxContext<{ handled: boolean }>, ...others: string[]) {
    this.received.push({ context, others })
    context.store.handled = true
  }
}

function createContext(key: string): InitxRunContext {
  return {
    key,
    cliOptions: {
      debug: true
    },
    optionsList: ['--debug'],
    packageInfo: {
      root: '/plugin-a',
      name: 'initx-plugin-a',
      version: '1.0.0',
      description: 'test plugin',
      author: 'tester',
      isLocal: false
    }
  }
}

describe('initxPlugin.run', () => {
  it('matches handler and executes with store writeback', async () => {
    const plugin = new TestPlugin()

    const handlers = await plugin.run(createContext('build'), 'dev')

    expect(handlers).toHaveLength(1)
    await handlers[0].handler()

    expect(createStoreMock).toHaveBeenCalledWith('initx-plugin-a', {
      handled: false
    })
    expect(writeStoreMock).toHaveBeenCalledWith('initx-plugin-a')

    expect(plugin.received).toHaveLength(1)
    expect(plugin.received[0].others).toEqual(['dev'])
    expect(plugin.received[0].context.rule.description).toBe('build handler')
    expect(plugin.received[0].context.store.handled).toBe(true)
  })

  it('filters out handlers when optional does not match', async () => {
    const plugin = new TestPlugin()

    const handlers = await plugin.run(createContext('build'), 'prod')

    expect(handlers).toHaveLength(0)
  })
})
