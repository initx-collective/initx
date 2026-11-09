import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { getPluginName, loadInitxConfig } from '../src/plugin/config'

const directories: string[] = []

function directory(): string {
  const value = mkdtempSync(join(tmpdir(), 'initx-config-'))
  directories.push(value)
  return value
}

afterEach(() => {
  for (const value of directories.splice(0))
    rmSync(value, { recursive: true, force: true })
})

describe('plugin config naming', () => {
  it('gets the short name from supported package names', () => {
    expect(getPluginName('@initx-plugin/env')).toBe('env')
    expect(getPluginName('initx-plugin-env')).toBe('env')
  })

  it('loads the default TypeScript config for config: true', async () => {
    const cwd = directory()
    const path = join(cwd, 'initx-env.config.ts')
    writeFileSync(path, 'export default { schema: 1, storage: { type: "github", repo: "owner/vault" } }\n')

    await expect(loadInitxConfig(true, '@initx-plugin/env', {}, cwd)).resolves.toEqual({
      config: {
        schema: 1,
        storage: { type: 'github', repo: 'owner/vault' }
      },
      source: path
    })
  })

  it('rejects an explicit format outside the plugin declaration', async () => {
    const cwd = directory()
    writeFileSync(join(cwd, 'initx-env.config.json'), '{}\n')

    await expect(loadInitxConfig(true, '@initx-plugin/env', { config: 'initx-env.config.json' }, cwd))
      .rejects
      .toThrow('Allowed formats: ts')
  })

  it('loads a declared YAML and INI format in declaration order', async () => {
    const cwd = directory()
    writeFileSync(join(cwd, 'custom.config.yaml'), 'schema: 1\nstorage:\n  type: github\n  repo: owner/yaml\n')

    await expect(loadInitxConfig({ files: ['custom'], formats: ['yaml', 'ini'] }, 'initx-plugin-test', {}, cwd)).resolves.toMatchObject({
      config: { storage: { repo: 'owner/yaml' } },
      source: join(cwd, 'custom.config.yaml')
    })

    const iniCwd = directory()
    writeFileSync(join(iniCwd, 'custom.config.ini'), '[storage]\ntype=github\nrepo=owner/ini\n')

    await expect(loadInitxConfig({ files: ['custom'], formats: ['ini'] }, 'initx-plugin-test', {}, iniCwd)).resolves.toMatchObject({
      config: { storage: { type: 'github', repo: 'owner/ini' } },
      source: join(iniCwd, 'custom.config.ini')
    })
  })
})
