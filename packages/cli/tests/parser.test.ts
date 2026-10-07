import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createCli, parseCliInput } from '../src/cli/parser'

describe('createCli', () => {
  it('exposes a single positional <something> command', () => {
    const cli = createCli()

    expect(cli.commands).toHaveLength(1)
    const command = cli.commands[0]

    expect(command.name).toBe('')
    expect(command.args.map(arg => arg.value)).toEqual(['something'])
    expect(command.args[0].required).toBe(true)
  })

  it('registers version and debug flags', () => {
    const cli = createCli()
    const command = cli.commands[0]
    const optionNames = command.options.flatMap(option => option.names)

    expect(optionNames).toContain('version')
    expect(optionNames).toContain('debug')
    expect(optionNames).toContain('d')
  })
})

describe('parseCliInput', () => {
  beforeEach(() => {
    // cac prints help / version via console.info; keep test output clean.
    vi.spyOn(console, 'info').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns a help result when --help is passed', () => {
    const result = parseCliInput(['node', 'initx.mjs', '--help'])

    expect(result.type).toBe('help')
  })

  it('returns a help result when -h is passed', () => {
    const result = parseCliInput(['node', 'initx.mjs', '-h'])

    expect(result.type).toBe('help')
  })

  it('returns a version result when --version is passed', () => {
    const result = parseCliInput(['node', 'initx.mjs', '--version'])

    expect(result.type).toBe('version')
  })

  it('returns a version result when -v is passed', () => {
    const result = parseCliInput(['node', 'initx.mjs', '-v'])

    expect(result.type).toBe('version')
  })

  it('returns a run result with the key and cliOptions', () => {
    const result = parseCliInput(['node', 'initx.mjs', 'build'])

    expect(result.type).toBe('run')
    if (result.type === 'run') {
      expect(result.input.key).toBe('build')
      expect(result.input.others).toEqual([])
      expect(result.input.cliOptions).toMatchObject({})
    }
  })

  it('puts positional values after the key into others', () => {
    const result = parseCliInput(['node', 'initx.mjs', 'build', 'dev', '--force'])

    expect(result.type).toBe('run')
    if (result.type === 'run') {
      expect(result.input.key).toBe('build')
      expect(result.input.others).toEqual(['dev'])
      expect(result.input.cliOptions.force).toBe(true)
    }
  })

  it('exposes the debug flag under the camelCase key', () => {
    const result = parseCliInput(['node', 'initx.mjs', 'lint', '--debug'])

    expect(result.type).toBe('run')
    if (result.type === 'run') {
      expect(result.input.cliOptions.debug).toBe(true)
      expect(result.input.cliOptions.d).toBe(true)
    }
  })

  it('returns undefined key when no positional argument is supplied', () => {
    const result = parseCliInput(['node', 'initx.mjs'])

    expect(result.type).toBe('run')
    if (result.type === 'run') {
      expect(result.input.key).toBeUndefined()
      expect(result.input.others).toEqual([])
    }
  })
})
