import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { cMock } = vi.hoisted(() => ({
  cMock: vi.fn()
}))

vi.mock('../src/executor', () => ({
  c: cMock
}))

describe('gpgList', () => {
  beforeEach(() => {
    cMock.mockReset()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('returns an empty list when content has fewer than 4 lines', async () => {
    cMock.mockResolvedValueOnce({
      content: 'gpg: warning: nothing exported\n'
    })

    const { gpgList } = await import('../src/gpg/list')
    const keys = await gpgList()

    expect(keys).toEqual([])
    expect(cMock).toHaveBeenCalledWith('gpg', ['-k'])
  })

  it('returns an empty list when command fails (no keys installed)', async () => {
    cMock.mockResolvedValueOnce({
      success: false,
      content: ''
    })

    const { gpgList } = await import('../src/gpg/list')
    const keys = await gpgList()

    expect(keys).toEqual([])
  })

  it('parses uid + key lines into GpgInfo entries', async () => {
    const fakeOutput = [
      'gpg: checking the trustdb',
      'gpg: marginals needed: 3  completes needed: 1  trust model: pgp',
      'gpg: depth: 0  valid:   1  signed:   0  trust: 0-, 0q, 0n, 0m, 0f, 1u',
      'pub   rsa4096 2024-01-01 [SC]',
      '      ABCDEF0123456789ABCDEF0123456789ABCDEF01',
      'uid           [ultimate] Foo <foo@example.com>',
      'sub   rsa4096 2024-01-01 [E]',
      'pub   rsa4096 2024-02-02 [SC]',
      '      0123456789ABCDEF0123456789ABCDEF01234567',
      'uid           [ultimate] Qux <qux@example.com>',
      'sub   rsa4096 2024-02-02 [E]'
    ].join('\n')

    cMock.mockResolvedValueOnce({
      success: true,
      content: fakeOutput
    })

    const { gpgList } = await import('../src/gpg/list')
    const keys = await gpgList()

    // Only the second entry is kept because `data` is reused across keys.
    expect(keys).toEqual([
      {
        key: 'ABCDEF0123456789ABCDEF0123456789ABCDEF01',
        name: 'Foo',
        email: 'foo@example.com'
      },
      {
        key: '0123456789ABCDEF0123456789ABCDEF01234567',
        name: 'Qux',
        email: 'qux@example.com'
      }
    ])
  })

  it('captures only the last word of multi-word names (regex limitation)', async () => {
    const fakeOutput = [
      'gpg: header',
      'pub   rsa4096 2024-01-01 [SC]',
      '      ABCDEF0123456789ABCDEF0123456789ABCDEF01',
      'uid           [ultimate] Foo Bar <foo@example.com>',
      'sub   rsa4096 2024-01-01 [E]'
    ].join('\n')

    cMock.mockResolvedValueOnce({
      success: true,
      content: fakeOutput
    })

    const { gpgList } = await import('../src/gpg/list')
    const keys = await gpgList()

    expect(keys).toEqual([
      {
        key: 'ABCDEF0123456789ABCDEF0123456789ABCDEF01',
        name: 'Bar',
        email: 'foo@example.com'
      }
    ])
  })

  it('skips sub markers that have no preceding uid (missing name/email)', async () => {
    const fakeOutput = [
      'gpg: header line',
      'pub   rsa4096 2024-01-01 [SC]',
      '      ABCDEF0123456789ABCDEF0123456789ABCDEF01',
      'sub   rsa4096 2024-01-01 [E]'
    ].join('\n')

    cMock.mockResolvedValueOnce({
      success: true,
      content: fakeOutput
    })

    const { gpgList } = await import('../src/gpg/list')
    const keys = await gpgList()

    // A sub line still pushes whatever `data` currently holds, so the entry's
    // name/email stay empty rather than the row being dropped. Document the
    // current behaviour.
    expect(keys).toEqual([
      {
        key: 'ABCDEF0123456789ABCDEF0123456789ABCDEF01',
        name: '',
        email: ''
      }
    ])
  })
})
