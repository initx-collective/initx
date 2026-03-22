const CODES = {
  reset: '\x1B[0m',
  // Foreground colors
  black: '\x1B[30m',
  red: '\x1B[31m',
  green: '\x1B[32m',
  yellow: '\x1B[33m',
  blue: '\x1B[34m',
  white: '\x1B[37m',
  gray: '\x1B[90m',
  // Background colors
  bgBlack: '\x1B[40m',
  bgRed: '\x1B[41m',
  bgGreen: '\x1B[42m',
  bgYellow: '\x1B[43m',
  bgBlue: '\x1B[44m',
  bgGray: '\x1B[100m',
  // Styles
  dim: '\x1B[2m',
  bold: '\x1B[1m'
} as const

type ColorName = keyof typeof CODES

class ColorBuilder {
  private fgColor: string = ''
  private bgColor: string = ''
  private styles: string[] = []

  constructor(private text: string) {}

  // Foreground colors
  black(): this { return this.setColor('black') }
  red(): this { return this.setColor('red') }
  green(): this { return this.setColor('green') }
  yellow(): this { return this.setColor('yellow') }
  blue(): this { return this.setColor('blue') }
  white(): this { return this.setColor('white') }
  gray(): this { return this.setColor('gray') }

  // Background colors
  bgBlack(): this { return this.setBgColor('bgBlack') }
  bgRed(): this { return this.setBgColor('bgRed') }
  bgGreen(): this { return this.setBgColor('bgGreen') }
  bgYellow(): this { return this.setBgColor('bgYellow') }
  bgBlue(): this { return this.setBgColor('bgBlue') }
  bgGray(): this { return this.setBgColor('bgGray') }

  // Styles
  dim(): this { return this.addStyle('dim') }
  bold(): this { return this.addStyle('bold') }

  // Reset
  reset(): this {
    this.fgColor = ''
    this.bgColor = ''
    this.styles = []
    return this
  }

  toString(): string {
    const codes = [...this.styles, this.fgColor, this.bgColor].filter(Boolean).join('')
    return codes ? `${codes}${this.text}${CODES.reset}` : this.text
  }

  valueOf(): string {
    return this.toString()
  }

  private setColor(color: ColorName): this {
    this.fgColor = CODES[color]
    return this
  }

  private setBgColor(color: ColorName): this {
    this.bgColor = CODES[color]
    return this
  }

  private addStyle(style: 'dim' | 'bold'): this {
    this.styles.push(CODES[style])
    return this
  }
}

/**
 * Create a color builder for the given text
 * @example
 * useColors('Hello').red().bgBlue()
 * useColors('World').green().bold()
 */
export function useColors(text: string): ColorBuilder {
  return new ColorBuilder(text)
}

// Direct color functions
export const red = (text: string) => useColors(text).red()
export const green = (text: string) => useColors(text).green()
export const yellow = (text: string) => useColors(text).yellow()
export const blue = (text: string) => useColors(text).blue()
export const white = (text: string) => useColors(text).white()
export const black = (text: string) => useColors(text).black()
export const gray = (text: string) => useColors(text).gray()
export const dim = (text: string) => useColors(text).dim()
export const bold = (text: string) => useColors(text).bold()
export const reset = (text: string) => useColors(text).reset()

export { ColorBuilder }
