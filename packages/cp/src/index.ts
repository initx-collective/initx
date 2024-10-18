import os from 'node:os'
import { existsSync, readFileSync } from 'node:fs'
import { resolve as pathResolve } from 'node:path'
import { copy as doCopy } from 'copy-paste'

import { InitxHandler } from 'packages/core/src'
import { log } from '@initx-plugin/utils'

import { CpType } from './types'

export class CpHandler extends InitxHandler {
  matchers = ['cp']

  async handle(_command: string, cpType: CpType, ...rest: string[]) {
    if (!cpType || typeof this[cpType] !== 'function') {
      return
    }

    if (!Array.isArray(rest)) {
      rest = []
    }

    (this[cpType] as (...args: string[]) => void)(...rest)
  }

  async [CpType.SSH]() {
    const sshDir = pathResolve(os.homedir(), '.ssh')
    const publicKeyPath = pathResolve(sshDir, 'id_rsa.pub')

    if (!existsSync(publicKeyPath)) {
      log.error(`SSH key not found, path: ${publicKeyPath}`)
      return
    }

    const publicKey = readFileSync(publicKeyPath, 'utf8')
    await this.copy(publicKey)

    log.success('Public key copied to clipboard')
  }

  private copy(content: string) {
    return new Promise((resolve, reject) => {
      doCopy(content, (err) => {
        if (err) {
          reject(err)
          return
        }

        resolve(true)
      })
    })
  }
}
