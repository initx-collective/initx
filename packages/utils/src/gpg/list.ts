import { c } from '../executor'

interface GpgInfo {
  key: string
  name: string
  email: string
}

export async function gpgList() {
  const result = await c('gpg', ['-k'])

  const keys: GpgInfo[] = []
  const lines = result.content.split(/\r?\n|\r/).filter(str => str.trim() !== '')

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
