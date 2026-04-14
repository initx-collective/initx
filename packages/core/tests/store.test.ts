import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import pathe from 'pathe'
import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('store', () => {
  let storeRoot = ''

  beforeEach(async () => {
    storeRoot = await mkdtemp(pathe.join(tmpdir(), 'initx-store-test-'))
    vi.resetModules()

    vi.doMock('../src/constants', () => ({
      STORE_DIR: pathe.join(storeRoot, 'stores'),
      STORE_FILE_NAME: 'store.json'
    }))
  })

  it('persists nested mutations only after writeStore', async () => {
    const { createStore, writeStore } = await import('../src/store')

    const store = createStore('plugin-a', {
      nested: {
        enabled: false
      },
      list: [1]
    })

    const storePath = pathe.join(storeRoot, 'stores', 'plugin-a', 'store.json')

    store.nested.enabled = true
    store.list.push(2)

    writeStore('plugin-a')

    const saved = JSON.parse(readFileSync(storePath, 'utf8'))

    expect(saved).toEqual({
      nested: {
        enabled: true
      },
      list: [1, 2]
    })
  })

  it('merges existing file with defaults', async () => {
    const storePath = pathe.join(storeRoot, 'stores', 'plugin-b', 'store.json')

    mkdirSync(pathe.dirname(storePath), { recursive: true })
    writeFileSync(storePath, JSON.stringify({
      existing: true,
      nested: {
        keep: 'yes'
      }
    }, null, 2))

    const { createStore } = await import('../src/store')

    const store = createStore('plugin-b', {
      existing: false,
      added: 123,
      nested: {
        keep: 'no',
        newKey: 'new'
      }
    })

    expect(store).toMatchObject({
      existing: true,
      added: 123,
      nested: {
        keep: 'yes',
        newKey: 'new'
      }
    })
  })

  it('keeps array fields from file without concatenating defaults', async () => {
    const storePath = pathe.join(storeRoot, 'stores', 'plugin-c', 'store.json')

    mkdirSync(pathe.dirname(storePath), { recursive: true })
    writeFileSync(storePath, JSON.stringify({
      prefix: ['fix', 'feat']
    }, null, 2))

    const { createStore } = await import('../src/store')

    const store = createStore('plugin-c', {
      prefix: ['fix', 'feat']
    })

    expect(store.prefix).toEqual(['fix', 'feat'])
  })
})
