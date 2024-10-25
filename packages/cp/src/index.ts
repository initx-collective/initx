import os from 'node:os'
import { existsSync, readFileSync } from 'node:fs'
import { resolve as pathResolve } from 'node:path'

import clipboard from 'clipboardy'

import { type InitxCtx, InitxHandler } from '@initx-plugin/core'
import { log } from '@initx-plugin/utils'

import { CpType } from './types'

export default class CpHandler extends InitxHandler {
  matchers = [
    {
      matching: 'cp',
      description: 'Copy SSH public key'
    }
  ]

  async handle(_ctx: InitxCtx, cpType: CpType, ...others: string[]) {
    if (!cpType || typeof this[cpType] !== 'function') {
      const typeList = CpType as Record<string, string>
      log.error(`Please enter the copy type, Available types: ${Object.keys(typeList).map(key => typeList[key])}`)
      return
    }

    ; (this[cpType] as (...args: string[]) => void)(...others)
  }

  async [CpType.SSH]() {
    const sshDir = pathResolve(os.homedir(), '.ssh')
    const publicKeyPath = pathResolve(sshDir, 'id_rsa.pub')

    if (!existsSync(publicKeyPath)) {
      log.error(`SSH key not found, path: ${publicKeyPath}`)
      return
    }

    const publicKey = readFileSync(publicKeyPath, 'utf8')
    this.copy(publicKey)

    log.success('Public key copied to clipboard')
  }

  private copy(content: string) {
    clipboard.writeSync(content)
  }
}
