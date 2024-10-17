import type { InitxHandler } from '@initx-plugin/types'

import { GitHandler } from '@initx-plugin/git'
import { CpHandler } from '@initx-plugin/cp'

const handlers: InitxHandler[] = [
  new GitHandler(),
  new CpHandler()
]

export default handlers
