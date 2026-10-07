import { describe, expect, it } from 'vitest'
import { where } from '../src/which'

describe('where', () => {
  it('returns the resolved path for a known command', () => {
    const result = where('node')

    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
    expect(result).toMatch(/node(\.exe)?$/i)
  })

  it('throws for an unknown command', () => {
    expect(() => where('definitely-not-a-real-command-xyz123')).toThrow()
  })
})
