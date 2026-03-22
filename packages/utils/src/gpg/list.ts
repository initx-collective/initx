import { c } from '../executor'

const LINE_SPLIT_RE = /\r?\n|\r/
const GPG_KEY_RE = /^\s+(\w{40})$/
const GPG_USER_RE = /\s(\w+)\s<([\w-]+@[\w-]+(?:\.[\w-]+)+)>/

interface GpgInfo {
  key: string
  name: string
  email: string
}

export async function gpgList() {
  const result = await c('gpg', ['-k'])

  const keys: GpgInfo[] = []
  const lines = result.content.split(LINE_SPLIT_RE).filter(str => str.trim() !== '')

  if (!lines || lines.length < 4) {
    return []
  }

  const data: GpgInfo = {
    key: '',
    name: '',
    email: ''
  }

  lines.forEach((line) => {
    const [, key] = GPG_KEY_RE.exec(line) || []

    if (key) {
      data.key = key
      return
    }

    if (line.startsWith('uid')) {
      const [, name, email] = GPG_USER_RE.exec(line) || []
      data.name = name
      data.email = email
      return
    }

    if (line.startsWith('sub')) {
      keys.push({
        ...data
      })
    }
  })

  return keys
}
