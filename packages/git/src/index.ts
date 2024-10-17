import { EOL } from 'node:os'
import { execa } from 'execa'
import { InitxHandler } from '@initx-plugin/types'
import { log } from '@initx-plugin/utils'

import { GitOriginUrlHandleType } from './types'

export class GitHandler extends InitxHandler {
  matchers = [
    /^(https?|git):\/\/.*\.git$/,
    /^(git@.*\.git)$/,
    /^ssh:\/\/git@.*\.git$/
  ]

  async handle(repository: string, branch?: string) {
    const hasRepository = await this.hasRepository()

    // 有仓库
    if (hasRepository) {
      const type = await this.setRemoteOriginUrl(repository)

      switch (type) {
        case GitOriginUrlHandleType.Add: {
          log.success('Remote origin url successfully added')
          break
        }

        case GitOriginUrlHandleType.Set: {
          log.success('Remote origin url successfully set')
          break
        }
      }

      const branches = await this.getBranches()

      if (branch && !branches?.includes(branch)) {
        await this.createBranch(branch)
        log.success('Branch successfully created')
      }

      return
    }

    // 无仓库
    await this.initlizeRepository(repository, branch)

    log.success('Git repository successfully initialized')
  }

  async hasRepository(): Promise<boolean> {
    const result = await this.execute(
      'git',
      ['rev-parse', '--is-inside-work-tree']
    )

    return result?.stdout === 'true'
  }

  async setRemoteOriginUrl(repository: string): Promise<GitOriginUrlHandleType> {
    const originUrl = await this.getRemoteOriginUrl()

    // 无事发生
    if (originUrl === repository) {
      return GitOriginUrlHandleType.None
    }

    // 修改
    if (originUrl === null) {
      await this.execute(
        'git',
        ['remote', 'add', 'origin', repository]
      )
      return GitOriginUrlHandleType.Add
    }

    // 新增
    await this.execute(
      'git',
      ['remote', 'set-url', 'origin', repository]
    )

    return GitOriginUrlHandleType.Set
  }

  async getRemoteOriginUrl(): Promise<string | null> {
    const result = await this.execute(
      'git',
      ['remote', 'get-url', 'origin']
    )

    return result?.stdout || null
  }

  async initlizeRepository(repository: string, branch?: string) {
    const initlizeCommand = ['init']

    if (branch) {
      initlizeCommand.push('-b', branch)
    }

    await this.execute('git', initlizeCommand)
    await this.execute('git', ['remote', 'add', 'origin', repository])
  }

  async getBranches() {
    const result = await this.execute('git', ['branch', '--format', '%(refname:short)'])

    return result?.stdout
      .split(EOL)
      .map(branch => branch.trim())
      .filter(Boolean)
  }

  async createBranch(branch: string) {
    await this.execute('git', ['checkout', '-b', branch])
  }

  async execute(command: string, options?: string[]) {
    try {
      return await execa(command, options)
    }
    // eslint-disable-next-line unused-imports/no-unused-vars
    catch (e) {
    }
  }
}
