import { c, log, where } from '@initx-plugin/utils'

export async function gpgHandle(switchFlag?: string) {
  if (!switchFlag || !~['true', 'false'].indexOf(switchFlag)) {
    log.error('Please enter true or false')
    return
  }

  let gpgPath: string

  try {
    gpgPath = where('gpg')
  }
  // eslint-disable-next-line unused-imports/no-unused-vars
  catch (e) {
    log.error('GPG is not installed')
    return
  }

  if (switchFlag === 'true') {
    await c('git', ['config', '--global', 'gpg.program', gpgPath])
    await c('git', ['config', '--global', 'commit.gpgsign', switchFlag])
    log.success(`GPG signing enabled, gpg program set to "${gpgPath}"`)
    return
  }

  await c('git', ['config', '--global', '--unset', 'gpg.program'])
  await c('git', ['config', '--global', '--unset', 'commit.gpgsign'])
  log.success('GPG signing disabled')
}

export async function gpgKeyHandle(key?: string) {
  if (!key) {
    log.error('Please enter a valid GPG key')
    return
  }

  await c('git', ['config', '--global', 'user.signingkey', key])

  log.success('GPG key set')
}
