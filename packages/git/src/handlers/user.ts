import { c, log } from '@initx-plugin/utils'

export async function userHandle(...args: string[]) {
  const [value1, value2, ...options] = args

  const value1IsEmail = isEmail(value1)

  const email = value1IsEmail ? value1 : value2
  const name = value1IsEmail ? value2 : value1

  await setUser(name, email, ...options)

  log.success(`Git user successfully set to ${name} <${email}>`)
}

async function setUser(name: string, email: string, ...options: string[]) {
  await c('git', ['config', ...options, 'user.email', email])
  await c('git', ['config', ...options, 'user.name', name])
}

function isEmail(email: string) {
  return /^[\w-]+@[\w-]+(?:.[\w-])+/.test(email)
}
