import { c, log } from '@initx-plugin/utils'

export async function userHandle(userInfo: string[]) {
  const [value1, value2] = userInfo

  if (!value1 || !value2) {
    log.error('Please provide name and email')
    return
  }

  const value1IsEmail = isEmail(value1)

  const email = value1IsEmail ? value1 : value2
  const name = value1IsEmail ? value2 : value1

  await setUser(name, email)

  log.success(`Git user successfully set to ${name} <${email}>`)
}

async function setUser(name: string, email: string) {
  await c('git', ['config', '--global', 'user.email', email])
  await c('git', ['config', '--global', 'user.name', name])
}

function isEmail(email: string) {
  return /^[\w-]+@[\w-]+(?:.[\w-])+/.test(email)
}
