import path from 'node:path'
import { existsSync, readdirSync } from 'fs-extra'

import { InitxHandler, type InitxOptions } from '@initx-plugin/core'
import { c, log } from '@initx-plugin/utils'

export class GpgHandler extends InitxHandler {
  matchers = {
    matching: 'gpg',
    description: 'Import or Export GPG key'
  }

  async handle(_options: InitxOptions, type: string, ...others: string[]) {
    if (!type) {
      log.error('Please enter a type, import or export')
      process.exit(0)
    }

    if (type === 'import') {
      await this.importKey()
      return
    }

    if (type === 'export') {
      const [key, filename] = others

      if (!key) {
        log.error('Please enter a valid GPG key')
        return
      }

      await this.exportKey(key, filename)
    }
  }

  async importKey() {
    const dir = readdirSync(process.cwd())
    const publicKeys = dir.filter(file => file.endsWith('public.key'))
    const privateKeys = dir.filter(file => file.endsWith('private.key'))

    if (publicKeys.length !== 1 || privateKeys.length !== 1) {
      log.error('Please make sure you have exactly one public.key and one private.key file in the current directory')
      return
    }

    const publicKeyPath = path.join(process.cwd(), publicKeys[0])
    const privateKeyPath = path.join(process.cwd(), privateKeys[0])

    await c('gpg', ['--import', publicKeyPath])
    const result = await c('gpg', ['--import', privateKeyPath])

    if (result && (result.stderr as string).includes('secret key imported')) {
      log.success(`GPG keys imported from "${publicKeys[0]}" and "${privateKeys[0]}"`)
      return
    }

    log.error('Error importing GPG keys')
  }

  async exportKey(key: string, filename?: string) {
    const result = await c('gpg', ['-k', key])

    if (result.failed) {
      log.error(result.stderr as string || 'Error exporting GPG key')
    }

    const publicKeyName = filename ? `${filename}_public.key` : 'public.key'
    const privateKeyName = filename ? `${filename}_private.key` : 'private.key'

    const publicKeyPath = path.join(process.cwd(), publicKeyName)
    const privateKeyPath = path.join(process.cwd(), privateKeyName)

    await c('gpg', ['--armor', '--output', publicKeyPath, '--export', key])
    await c('gpg', ['--armor', '--output', privateKeyPath, '--export-secret-keys', key])

    if (!existsSync(privateKeyPath) || !existsSync(publicKeyPath)) {
      log.error('Error exporting GPG keys')
      return
    }

    log.success(`GPG keys exported to "${publicKeyName}" and "${privateKeyName}"`)
  }
}
