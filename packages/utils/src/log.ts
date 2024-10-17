import c from 'picocolors'

export const log = {
  success: (msg: string) => console.log(`${c.bgGreen(c.black(' SUCCESS '))} ${msg}`),
  info: (msg: string) => console.log(`${c.bgBlue(c.white(' INFO '))} ${msg}`),
  warn: (msg: string) => console.log(`${c.bgYellow(c.black(' WARN '))} ${msg}`),
  error: (msg: string) => console.log(`${c.bgRed(c.white(' ERROR '))} ${msg}`)
}
