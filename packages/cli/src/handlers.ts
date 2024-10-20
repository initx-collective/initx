import type { InitxHandler } from '@initx-plugin/core'

import GitHandler from '@initx-plugin/git'
import CpHandler from '@initx-plugin/cp'
import GpgHandler from '@initx-plugin/gpg'

const handlers: InitxHandler[] = [
  new GitHandler(),
  new CpHandler(),
  new GpgHandler()
]

export default handlers
