import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CODES } from '../src/colors'
import { logger } from '../src/logger'

describe('logger', () => {
  let logMock: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    logMock = vi.spyOn(console, 'log').mockImplementation(() => {})
    logger.setLevel('info')
  })

  afterEach(() => {
    vi.restoreAllMocks()
    logger.setLevel('info')
  })

  it('defaults to the info level so debug messages are hidden', () => {
    logger.setLevel('debug')
    logger.setLevel('info')

    logger.debug('hidden')
    logger.info('visible')

    expect(logMock).toHaveBeenCalledTimes(1)
    expect(logMock.mock.calls[0][0]).toContain('visible')
  })

  it('respects log level threshold', () => {
    logger.setLevel('warn')

    logger.info('hidden')
    logger.warn('hidden-warn')
    logger.error('visible')

    expect(logMock).toHaveBeenCalledTimes(2)
    expect(logMock.mock.calls[0][0]).toContain('hidden-warn')
    expect(logMock.mock.calls[1][0]).toContain('visible')
  })

  it('emits nothing when the level is set above every method', () => {
    // The highest priority is `error` (4); going higher is a no-op threshold.
    logger.setLevel('error' as any)

    logger.debug('hidden')
    logger.info('hidden')
    logger.success('hidden')
    logger.warn('hidden')
    logger.error('still visible')

    expect(logMock).toHaveBeenCalledTimes(1)
    expect(logMock.mock.calls[0][0]).toContain('still visible')
  })

  it('uses shared color codes for the debug label', () => {
    logger.setLevel('debug')

    logger.debug('hello')

    const output = logMock.mock.calls[0][0]

    expect(output).toContain(CODES.bgGray)
    expect(output).toContain(CODES.black)
    expect(output).toContain(CODES.reset)
    expect(output).toContain(' DEBUG ')
    expect(output).toContain('hello')
  })

  it('renders each level with its own background color', () => {
    logger.setLevel('debug')

    logger.info('info-msg')
    logger.success('success-msg')
    logger.warn('warn-msg')
    logger.error('error-msg')

    const outputs = logMock.mock.calls.map((call: unknown[]) => call[0])

    expect(outputs[0]).toContain(CODES.bgBlue)
    expect(outputs[0]).toContain(' INFO ')

    expect(outputs[1]).toContain(CODES.bgGreen)
    expect(outputs[1]).toContain(' SUCCESS ')

    expect(outputs[2]).toContain(CODES.bgYellow)
    expect(outputs[2]).toContain(' WARN ')

    expect(outputs[3]).toContain(CODES.bgRed)
    expect(outputs[3]).toContain(' ERROR ')
  })

  it('resets state after setLevel changes', () => {
    logger.setLevel('error')
    logger.info('hidden after reset')

    logger.setLevel('debug')
    logger.debug('visible after reset')

    expect(logMock).toHaveBeenCalledTimes(1)
    expect(logMock.mock.calls[0][0]).toContain('visible after reset')
  })
})
