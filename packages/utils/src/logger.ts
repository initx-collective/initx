/* eslint-disable no-console */

import { CODES } from './colors'

type LogLevel = 'debug' | 'info' | 'success' | 'warn' | 'error'

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  success: 2,
  warn: 3,
  error: 4
}

function colorize(text: string, color: keyof typeof CODES, bgColor: keyof typeof CODES): string {
  return `${CODES[bgColor]}${CODES[color]}${text}${CODES.reset}`
}

class Logger {
  private level: LogLevel = 'info'

  setLevel(level: LogLevel): void {
    this.level = level
  }

  private shouldLog(level: LogLevel): boolean {
    return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[this.level]
  }

  debug(msg: string): void {
    if (this.shouldLog('debug'))
      console.log(`${colorize(' DEBUG ', 'black', 'bgGray')} ${msg}`)
  }

  info(msg: string): void {
    if (this.shouldLog('info'))
      console.log(`${colorize(' INFO ', 'white', 'bgBlue')} ${msg}`)
  }

  success(msg: string): void {
    if (this.shouldLog('success'))
      console.log(`${colorize(' SUCCESS ', 'black', 'bgGreen')} ${msg}`)
  }

  warn(msg: string): void {
    if (this.shouldLog('warn'))
      console.log(`${colorize(' WARN ', 'black', 'bgYellow')} ${msg}`)
  }

  error(msg: string): void {
    if (this.shouldLog('error'))
      console.log(`${colorize(' ERROR ', 'white', 'bgRed')} ${msg}`)
  }
}

export const logger = new Logger()

/**
 * @deprecated Use `logger` instead
 */
export const log = logger
