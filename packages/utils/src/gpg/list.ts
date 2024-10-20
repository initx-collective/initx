import { EOL } from 'node:os'

import { c } from '../execa'

interface GpgInfo {
  key: string
  name: string
  email: string
}

export async function gpgList() {
  const result = await c('gpg', ['-k'])

  const keys: GpgInfo[] = []
  const lines = (result.stdout as string).split(EOL).filter(str => str.trim() !== '')

  if (!lines || lines.length < 4) {
    return []
  }

  const data: GpgInfo = {
    key: '',
    name: '',
    email: ''
  }

  lines.forEach((line) => {
    const [, key] = /^\s+(\w{40})$/.exec(line) || []

    if (key) {
      data.key = key
      return
    }

    if (line.startsWith('uid')) {
      const [, name, email] = /\s(\w+)\s<([\w-]+@[\w-]+(?:\.[\w-]+)+)>/.exec(line) || []
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
