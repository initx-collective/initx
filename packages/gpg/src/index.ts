import path from 'node:path'
import inquirer from 'inquirer'
import { existsSync, readdirSync, unlinkSync } from 'fs-extra'

import { type InitxCtx, InitxHandler } from '@initx-plugin/core'
import { c, gpgList, log } from '@initx-plugin/utils'

export default class GpgHandler extends InitxHandler {
  matchers = {
    matching: 'gpg',
    description: 'GPG key management'
  }

  async handle(_ctx: InitxCtx, type: string, ...others: string[]) {
    if (!type) {
      log.error('Please enter a type, import or export')
      process.exit(0)
    }

    switch (type) {
      case 'import': {
        await this.importKey()
        break
      }

      case 'export': {
        const key = await this.findKey()

        if (!key) {
          log.error('No GPG keys found')
          return
        }

        const [filename] = others
        await this.exportKey(key, filename)

        break
      }

      case 'delete': {
        const key = await this.findKey()

        if (!key) {
          log.error('No GPG keys found')
          return
        }

        const [deleteType] = others

        this.deleteKey(key, deleteType)
        break
      }
    }
  }

  async findKey() {
    const list = await gpgList()

    if (list.length === 0) {
      return null
    }

    if (list.length === 1) {
      const [firstKey] = list
      return firstKey.key
    }

    const { key } = await inquirer.prompt([
      {
        name: 'key',
        type: 'list',
        message: 'Select a GPG key to export',
        choices: list.map(gpg => ({
          name: `${gpg.name} <${gpg.email}> [${gpg.key}]`,
          value: gpg.key
        }))
      }
    ])

    return key
  }

  async importKey() {
    const dir = readdirSync(process.cwd())
    const publicKeys = dir.filter(file => file.endsWith('public.key'))
    const privateKeys = dir.filter(file => file.endsWith('private.key'))

    const keys = [...publicKeys, ...privateKeys]

    if (keys.length === 0) {
      log.error('No matching key file found')
      return
    }

    for (const key of keys) {
      const keyPath = path.join(process.cwd(), key)
      log.info(`Importing GPG key from "${key}"`)
      await c('gpg', ['--import', keyPath])
    }
  }

  async exportKey(key: string, filename?: string) {
    const publicKeyName = filename ? `${filename}_public.key` : 'public.key'
    const privateKeyName = filename ? `${filename}_private.key` : 'private.key'

    const publicKeyPath = path.join(process.cwd(), publicKeyName)
    const privateKeyPath = path.join(process.cwd(), privateKeyName)

    if (existsSync(publicKeyPath) || existsSync(privateKeyPath)) {
      const { overwrite } = await inquirer.prompt([{
        type: 'confirm',
        name: 'overwrite',
        default: false,
        message: `Key file "${publicKeyName}" or "${privateKeyName}" already exists, overwrite?`
      }])

      if (!overwrite) {
        return
      }

      // remove existing key files
      if (existsSync(publicKeyPath)) {
        unlinkSync(publicKeyPath)
      }

      if (existsSync(privateKeyPath)) {
        unlinkSync(privateKeyPath)
      }
    }

    await c('gpg', ['--armor', '--output', publicKeyPath, '--export', key])
    await c('gpg', ['--armor', '--output', privateKeyPath, '--export-secret-keys', key])

    if (!existsSync(privateKeyPath) || !existsSync(publicKeyPath)) {
      log.error('Error exporting GPG keys')
      return
    }

    log.success(`GPG keys exported to "${publicKeyName}" and "${privateKeyName}"`)
  }

  async deleteKey(key: string, deleteType?: string) {
    const hasDeleteType = !!(deleteType && ~['public', 'private'].indexOf(deleteType))

    const { confirm } = await inquirer.prompt([{
      type: 'confirm',
      name: 'confirm',
      default: false,
      message: `Are you sure you want to delete the${hasDeleteType ? ` ${deleteType}` : ''} key "${key}"?`
    }])

    if (!confirm) {
      return
    }

    if (!hasDeleteType || deleteType === 'private') {
      await c('gpg', ['--delete-secret-keys', key], {
        stdin: 'inherit'
      })
    }

    if (!hasDeleteType || deleteType === 'public') {
      await c('gpg', ['--delete-keys', key], {
        stdin: 'inherit'
      })
    }
  }
}
