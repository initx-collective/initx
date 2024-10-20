import { InitxHandler, type InitxOptions } from '@initx-plugin/core'

import { GitMatcher } from './types'
import { userHandle } from './handlers/user'
import { repositoryHandle } from './handlers/repository'
import { gpgHandle, gpgKeyHandle } from './handlers/gpg'

export class GitHandler extends InitxHandler {
  matchers = {
    [GitMatcher.Init]: [
      /^(https?|git):\/\/.*\.git$/,
      /^(git@.*\.git)$/,
      /^ssh:\/\/git@.*\.git$/
    ],

    [GitMatcher.User]: 'user',

    [GitMatcher.Gpg]: 'gpg',

    [GitMatcher.GpgKey]: /^\w{40}$/
  }

  async handle({ key, optionsList }: InitxOptions, type: GitMatcher, ...others: string[]) {
    switch (type) {
      case GitMatcher.Init: {
        repositoryHandle(key, ...others)
        break
      }

      case GitMatcher.User: {
        userHandle(others, optionsList)
        break
      }

      case GitMatcher.Gpg: {
        const [switchFlag] = others
        gpgHandle(switchFlag)
        break
      }

      case GitMatcher.GpgKey: {
        gpgKeyHandle(key)
        break
      }
    }
  }
}
