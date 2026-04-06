import { describe, expect, it, vi } from 'vitest'

import { detectManager, installManager } from '../src/plugin/manager'

const { listMock, installMock } = vi.hoisted(() => ({
  listMock: vi.fn(),
  installMock: vi.fn()
}))

vi.mock('../src/plugin/system', () => ({
  pluginSystem: {
    list: listMock,
    install: installMock
  }
}))

describe('plugin manager helpers', () => {
  it('returns true when manager plugin exists', async () => {
    listMock.mockResolvedValueOnce([
      {
        name: '@initx-plugin/manager'
      }
    ])

    await expect(detectManager()).resolves.toBe(true)
  })

  it('returns false when manager plugin does not exist', async () => {
    listMock.mockResolvedValueOnce([
      {
        name: '@initx-plugin/other'
      }
    ])

    await expect(detectManager()).resolves.toBe(false)
  })

  it('returns false on list errors', async () => {
    listMock.mockRejectedValueOnce(new Error('boom'))

    await expect(detectManager()).resolves.toBe(false)
  })

  it('installs manager plugin', async () => {
    installMock.mockResolvedValueOnce(undefined)

    await installManager()

    expect(installMock).toHaveBeenCalledWith('@initx-plugin/manager')
  })
})
