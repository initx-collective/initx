import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import pathe from 'pathe'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const GIT_REPORT_DEFAULT = {
  name: '',
  email: '',
  prefix: [] as string[],
  projects: [] as { name: string, path: string }[]
}

function storePathFor(name: string, storeRoot: string) {
  return pathe.join(storeRoot, 'stores', name, 'store.json')
}

function seedStore(name: string, storeRoot: string, data: Record<string, unknown>) {
  const storePath = storePathFor(name, storeRoot)
  mkdirSync(pathe.dirname(storePath), { recursive: true })
  writeFileSync(storePath, JSON.stringify(data, null, 2))
  return storePath
}

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

  it('keeps array fields from file when defaults are empty', async () => {
    const storePath = seedStore('plugin-c', storeRoot, {
      prefix: ['fix', 'feat']
    })

    const { createStore } = await import('../src/store')

    const store = createStore('plugin-c', GIT_REPORT_DEFAULT)

    expect(store.prefix).toEqual(['fix', 'feat'])

    const saved = JSON.parse(readFileSync(storePath, 'utf8'))
    expect(saved.prefix).toEqual(['fix', 'feat'])
  })

  it('overwrites default arrays with file values without concatenating', async () => {
    seedStore('plugin-d', storeRoot, {
      prefix: ['a', 'b', 'c']
    })

    const { createStore } = await import('../src/store')

    const store = createStore('plugin-d', {
      prefix: ['a', 'b']
    })

    expect(store.prefix).toEqual(['a', 'b', 'c'])
  })

  it('keeps projects object arrays from file when defaults are empty', async () => {
    const projects = [{ name: 'my-app', path: '/path/to/my-app' }]
    const storePath = seedStore('plugin-e', storeRoot, { projects })

    const { createStore } = await import('../src/store')

    const store = createStore('plugin-e', {
      projects: []
    })

    expect(store.projects).toEqual(projects)

    const saved = JSON.parse(readFileSync(storePath, 'utf8'))
    expect(saved.projects).toEqual(projects)
  })

  it('merges full git-report store shape without clearing array fields', async () => {
    const fileData = {
      name: 'imba97',
      email: 'mail@imba97.cn',
      prefix: ['fix', 'feat', 'perf', 'refactor'],
      projects: [{ name: 'demo', path: '/demo' }]
    }
    const storePath = seedStore('initx-plugin-git-report', storeRoot, fileData)

    const { createStore } = await import('../src/store')

    const store = createStore('initx-plugin-git-report', GIT_REPORT_DEFAULT)

    expect(store).toMatchObject(fileData)

    const saved = JSON.parse(readFileSync(storePath, 'utf8'))
    expect(saved).toMatchObject(fileData)
  })

  it('survives consecutive read-only createStore calls', async () => {
    seedStore('plugin-f', storeRoot, {
      prefix: ['fix', 'feat']
    })

    const { createStore } = await import('../src/store')
    const defaults = { prefix: [] as string[] }

    const first = createStore('plugin-f', defaults)
    expect(first.prefix).toEqual(['fix', 'feat'])

    const second = createStore('plugin-f', defaults)
    expect(second.prefix).toEqual(['fix', 'feat'])

    const saved = JSON.parse(readFileSync(storePathFor('plugin-f', storeRoot), 'utf8'))
    expect(saved.prefix).toEqual(['fix', 'feat'])
  })

  it('persists array replacement across createStore reload', async () => {
    seedStore('plugin-g', storeRoot, {
      prefix: ['old']
    })

    const { createStore, writeStore } = await import('../src/store')
    const defaults = { prefix: [] as string[] }

    const store = createStore('plugin-g', defaults)
    store.prefix = ['fix', 'feat', 'perf', 'refactor']
    writeStore('plugin-g')

    const saved = JSON.parse(readFileSync(storePathFor('plugin-g', storeRoot), 'utf8'))
    expect(saved.prefix).toEqual(['fix', 'feat', 'perf', 'refactor'])

    const reloaded = createStore('plugin-g', defaults)
    expect(reloaded.prefix).toEqual(['fix', 'feat', 'perf', 'refactor'])
  })

  it('fills missing array fields from defaults', async () => {
    seedStore('plugin-h', storeRoot, {
      name: 'imba97',
      email: 'mail@imba97.cn'
    })

    const { createStore } = await import('../src/store')

    const store = createStore('plugin-h', GIT_REPORT_DEFAULT)

    expect(store.name).toBe('imba97')
    expect(store.email).toBe('mail@imba97.cn')
    expect(store.prefix).toEqual([])
    expect(store.projects).toEqual([])
  })

  it('keeps empty array fields from file', async () => {
    seedStore('plugin-i', storeRoot, {
      prefix: []
    })

    const { createStore } = await import('../src/store')

    const store = createStore('plugin-i', {
      prefix: ['should-not-appear']
    })

    expect(store.prefix).toEqual([])
  })

  it('falls back to defaults when store file is invalid json', async () => {
    const storePath = storePathFor('plugin-j', storeRoot)
    mkdirSync(pathe.dirname(storePath), { recursive: true })
    writeFileSync(storePath, '{ invalid json', 'utf8')

    const { createStore } = await import('../src/store')

    const store = createStore('plugin-j', {
      name: 'default-name',
      prefix: []
    })

    expect(store.name).toBe('default-name')
    expect(store.prefix).toEqual([])
  })

  it('clones default arrays on first create without sharing references', async () => {
    const defaults = {
      prefix: [] as string[],
      projects: [] as { name: string, path: string }[]
    }

    const { createStore } = await import('../src/store')

    const store = createStore('plugin-k', defaults)

    expect(store.prefix).toEqual([])
    expect(store.prefix).not.toBe(defaults.prefix)
    expect(store.projects).toEqual([])
    expect(store.projects).not.toBe(defaults.projects)

    store.prefix.push('feat')
    expect(defaults.prefix).toEqual([])
  })

  it('persists in-place array mutations after loading from file', async () => {
    seedStore('plugin-l', storeRoot, {
      prefix: ['fix']
    })

    const { createStore, writeStore } = await import('../src/store')

    const store = createStore('plugin-l', { prefix: [] as string[] })
    store.prefix.push('feat')
    writeStore('plugin-l')

    const saved = JSON.parse(readFileSync(storePathFor('plugin-l', storeRoot), 'utf8'))
    expect(saved.prefix).toEqual(['fix', 'feat'])
  })

  it('supports both array replacement and in-place mutation', async () => {
    const { createStore, writeStore } = await import('../src/store')
    const defaults = { tags: [] as string[] }

    const store = createStore('plugin-m', defaults)
    store.tags = ['a', 'b']
    writeStore('plugin-m')

    const replaced = createStore('plugin-m', defaults)
    expect(replaced.tags).toEqual(['a', 'b'])

    replaced.tags.push('c')
    writeStore('plugin-m')

    const saved = JSON.parse(readFileSync(storePathFor('plugin-m', storeRoot), 'utf8'))
    expect(saved.tags).toEqual(['a', 'b', 'c'])
  })
})
