import { type InitxCtx, InitxHandler } from '@initx-plugin/core'

import { GitMatcher } from './types'
import { userHandle } from './handlers/user'
import { repositoryHandle } from './handlers/repository'
import { gpgHandle, gpgKeyHandle } from './handlers/gpg'

export default class GitHandler extends InitxHandler {
  matchers = {
    [GitMatcher.Init]: {
      matching: [
        /^(https?|git):\/\/.*\.git$/,
        /^(git@.*\.git)$/,
        /^ssh:\/\/git@.*\.git$/
      ],
      description: 'Initialize a new git repository'
    },

    [GitMatcher.User]: {
      matching: 'user',
      description: 'Set user name and email for git configuration'
    },

    [GitMatcher.Gpg]: {
      matching: 'gpg',
      description: 'Enable or disable GPG signing for git commits'
    },

    [GitMatcher.GpgKey]: {
      matching: /^[A-F0-9]{40}$/,
      description: 'Set GPG key for git commits'
    }
  }

  async handle({ key }: InitxCtx, type: GitMatcher, ...others: string[]) {
    switch (type) {
      case GitMatcher.Init: {
        repositoryHandle(key, ...others)
        break
      }

      case GitMatcher.User: {
        userHandle(others)
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
