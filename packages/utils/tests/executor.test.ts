import { randomInt } from 'node:crypto'
import { expect, it } from 'vitest'

import { c } from '../src'

it('command executor', async () => {
  const npmResult = await c('npm', ['-v'])

  expect(npmResult.success).toBe(true)
  expect(npmResult.content).toString()
})

it('command executor with error', async () => {
  const randomNumber = randomInt(0, 100)
  const command = `command${randomNumber}`
  const npmResult = await c(command)

  expect(npmResult.success).toBe(false)
  expect(npmResult.content).toBe(`Can not find command: ${command}`)
})
