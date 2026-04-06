/* eslint-disable no-console */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CODES } from '../src/colors'
import { logger } from '../src/logger'

describe('logger', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {})
    logger.setLevel('info')
  })

  afterEach(() => {
    vi.restoreAllMocks()
    logger.setLevel('info')
  })

  it('respects log level threshold', () => {
    logger.setLevel('warn')

    logger.info('hidden')
    logger.error('visible')

    const logMock = vi.mocked(console.log)

    expect(logMock).toHaveBeenCalledTimes(1)
    expect(logMock.mock.calls[0][0]).toContain('visible')
  })

  it('uses shared color codes for debug label', () => {
    logger.setLevel('debug')

    logger.debug('hello')

    const output = vi.mocked(console.log).mock.calls[0][0]

    expect(output).toContain(CODES.bgGray)
    expect(output).toContain(CODES.black)
    expect(output).toContain(CODES.reset)
    expect(output).toContain(' DEBUG ')
  })
})
