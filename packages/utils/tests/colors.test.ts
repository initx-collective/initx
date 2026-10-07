import { describe, expect, it } from 'vitest'
import {
  black,
  blue,
  bold,
  CODES,
  ColorBuilder,
  dim,
  gray,
  green,
  red,
  reset,
  useColors,
  white,
  yellow
} from '../src/colors'

describe('cODES', () => {
  it('exposes the expected ANSI escape codes', () => {
    expect(CODES.reset).toBe('\x1B[0m')
    expect(CODES.red).toBe('\x1B[31m')
    expect(CODES.bgBlue).toBe('\x1B[44m')
    expect(CODES.bold).toBe('\x1B[1m')
  })
})

describe('useColors', () => {
  it('returns plain text when no styles are applied', () => {
    expect(useColors('hello').toString()).toBe('hello')
  })

  it('chains foreground, background and style codes', () => {
    const output = useColors('hi').red().bgBlue().bold().toString()

    expect(output).toBe(`${CODES.bold}${CODES.red}${CODES.bgBlue}hi${CODES.reset}`)
  })

  it('supports valueOf coercion like template strings expect', () => {
    const builder = useColors('value').green()

    expect(`${builder}`).toBe(`${CODES.green}value${CODES.reset}`)
    expect(builder.valueOf()).toBe(builder.toString())
  })

  it('overrides a foreground color when applied twice', () => {
    const output = useColors('override').red().blue().toString()

    expect(output).toBe(`${CODES.blue}override${CODES.reset}`)
    expect(output).not.toContain(CODES.red)
  })

  it('clears state with reset() and produces plain text again', () => {
    const builder = useColors('clear').red().bgBlue().bold()

    builder.reset()

    expect(builder.toString()).toBe('clear')
  })
})

describe('direct color helpers', () => {
  it.each([
    [red, 'red'],
    [green, 'green'],
    [yellow, 'yellow'],
    [blue, 'blue'],
    [white, 'white'],
    [black, 'black'],
    [gray, 'gray']
  ])('applies the expected foreground color for %s', (helper, key) => {
    expect(helper('x').toString()).toBe(`${CODES[key as keyof typeof CODES]}x${CODES.reset}`)
  })

  it('applies styles for dim and bold', () => {
    expect(dim('x').toString()).toBe(`${CODES.dim}x${CODES.reset}`)
    expect(bold('x').toString()).toBe(`${CODES.bold}x${CODES.reset}`)
  })

  it('reset() helper produces plain text', () => {
    expect(reset('plain').toString()).toBe('plain')
  })
})

describe('colorBuilder return type', () => {
  it('returns the builder from chainable methods for further chaining', () => {
    const builder = new ColorBuilder('text')

    expect(builder.red()).toBe(builder)
    expect(builder.bgGreen()).toBe(builder)
    expect(builder.bold()).toBe(builder)
    expect(builder.reset()).toBe(builder)
  })
})
