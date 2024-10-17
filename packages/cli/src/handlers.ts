import type { InitxHandler } from '@initx-plugin/types'

import { GitHandler } from '@initx-plugin/git'

const handlers: InitxHandler[] = [
  new GitHandler()
]

export default handlers
