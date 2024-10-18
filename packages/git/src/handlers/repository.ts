import { EOL } from 'node:os'
import { c, log } from '@initx-plugin/utils'

import { GitOriginUrlHandleType } from '../types'

export async function repositoryHandle(repository: string, branch?: string) {
  // 无仓库
  if (!await hasRepository()) {
    await initlizeRepository(repository, branch)

    log.success('Git repository successfully initialized')

    return
  }

  // 有仓库
  const type = await setRemoteOriginUrl(repository)

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

  const branches = await getBranches()

  if (branch && !branches?.includes(branch)) {
    await createBranch(branch)
    log.success('Branch successfully created')
  }
}

async function hasRepository(): Promise<boolean> {
  const result = await c(
    'git',
    ['rev-parse', '--is-inside-work-tree']
  )

  return result?.stdout === 'true'
}

async function setRemoteOriginUrl(repository: string): Promise<GitOriginUrlHandleType> {
  const originUrl = await getRemoteOriginUrl()

  // 无事发生
  if (originUrl === repository) {
    return GitOriginUrlHandleType.None
  }

  // 修改
  if (originUrl === null) {
    await c(
      'git',
      ['remote', 'add', 'origin', repository]
    )
    return GitOriginUrlHandleType.Add
  }

  // 新增
  await c(
    'git',
    ['remote', 'set-url', 'origin', repository]
  )

  return GitOriginUrlHandleType.Set
}

async function getRemoteOriginUrl(): Promise<string | null> {
  const result = await c(
    'git',
    ['remote', 'get-url', 'origin']
  )

  return result?.stdout || null
}

async function initlizeRepository(repository: string, branch?: string) {
  const initlizeCommand = ['init']

  if (branch) {
    initlizeCommand.push('-b', branch)
  }

  await c('git', initlizeCommand)
  await c('git', ['remote', 'add', 'origin', repository])
}

async function getBranches() {
  const result = await c('git', ['branch', '--format', '%(refname:short)'])

  return result?.stdout
    .split(EOL)
    .map(branch => branch.trim())
    .filter(Boolean)
}

async function createBranch(branch: string) {
  await c('git', ['checkout', '-b', branch])
}
