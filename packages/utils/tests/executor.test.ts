import { randomInt } from 'node:crypto'
import { describe, expect, it, vi } from 'vitest'

import { c, loadingFunction } from '../src/executor'

describe('command executor', () => {
  it('returns trimmed stdout on success', async () => {
    const npmResult = await c('npm', ['-v'])

    expect(npmResult.success).toBe(true)
    expect(npmResult.content).toBeTypeOf('string')
    expect(npmResult.content.length).toBeGreaterThan(0)
    // version strings should not contain leading/trailing whitespace
    expect(npmResult.content).toBe(npmResult.content.trim())
  })

  it('returns stderr content when command exits non-zero', async () => {
    // `node -e "process.stderr.write(\'boom\') ; process.exit(1)"` writes to
    // stderr and exits with a non-zero status, triggering the failure branch.
    const nodeResult = await c('node', ['-e', `process.stderr.write('boom-error'); process.exit(1)`])

    expect(nodeResult.success).toBe(false)
    expect(nodeResult.content).toContain('boom-error')
  })

  it('reports a missing command instead of throwing', async () => {
    const randomNumber = randomInt(0, 100)
    const command = `command${randomNumber}`
    const npmResult = await c(command)

    expect(npmResult.success).toBe(false)
    expect(npmResult.content).toBe(`Can not find command: ${command}`)
  })

  it('caches command detection so the second call has the same result', async () => {
    const first = await c('npm', ['-v'])
    const second = await c('npm', ['-v'])

    expect(first.success).toBe(true)
    expect(second.success).toBe(true)
  })
})

describe('loadingFunction', () => {
  it('returns the value resolved by the wrapped function', async () => {
    const result = await loadingFunction('working', async () => 'done')

    expect(result).toBe('done')
  })

  it('invokes the wrapped function exactly once', async () => {
    const fn = vi.fn().mockResolvedValue(42)

    await loadingFunction('working', fn)

    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('still stops the spinner when the wrapped function rejects', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('nope'))

    await expect(loadingFunction('working', fn)).rejects.toThrow('nope')

    expect(fn).toHaveBeenCalledTimes(1)
  })
})
