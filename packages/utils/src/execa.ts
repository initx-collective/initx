import { execa } from 'execa'

export async function c(command: string, options?: string[]) {
  try {
    return await execa(command, options)
  }
  // eslint-disable-next-line unused-imports/no-unused-vars
  catch (e) {

  }
}
