import { InitxHandler, type InitxOptions } from '@initx-plugin/core'

import { GitMatcher } from './types'
import { userHandle } from './handlers/user'
import { repositoryHandle } from './handlers/repository'

export class GitHandler extends InitxHandler {
  matchers = {
    [GitMatcher.Init]: [
      /^(https?|git):\/\/.*\.git$/,
      /^(git@.*\.git)$/,
      /^ssh:\/\/git@.*\.git$/
    ],

    [GitMatcher.User]: 'user',

    [GitMatcher.Gpg]: 'gpg'
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
        console.log('gpg handler not implemented')
        break
      }
    }
  }
}
