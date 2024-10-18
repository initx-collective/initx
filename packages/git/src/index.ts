import { InitxHandler } from '@initx-plugin/types'
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

  async handle(value: string, type: GitMatcher, ...others: string[]) {
    switch (type) {
      case GitMatcher.Init: {
        repositoryHandle(value, ...others)
        break
      }

      case GitMatcher.User: {
        userHandle(...others)
        break
      }

      case GitMatcher.Gpg: {
        console.log('gpg handler not implemented')
        break
      }
    }
  }
}
