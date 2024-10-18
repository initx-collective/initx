type MaybeArray<T> = T | T[]
type MaybePromise<T> = T | Promise<T>

type BaseMatchers = MaybeArray<string | RegExp>
type TypeMatchers = Record<string, BaseMatchers>

type Matchers = BaseMatchers | TypeMatchers

export interface InitxOptions {
  /**
   * Matching string
   *
   * The key that was used to match the handler
   */
  key: string

  /**
   * CLI options
   *
   * cac package parsed options
   */
  cliOptions: Record<string, any>

  /**
   * Options list
   *
   * cli options list, like
   * @example ['--global']
   */
  optionsList: string[]
}

export abstract class InitxHandler {
  abstract matchers: Matchers
  abstract handle(options: InitxOptions, ...others: string[]): MaybePromise<void>

  public async run(options: InitxOptions, ...others: string[]): Promise<void> {
    if (this.isObject(this.matchers)) {
      const keys = Object.keys(this.matchers)

      for (let i = 0; i < keys.length; i++) {
        const matcher = this.matchers[keys[i]]
        const isPassed = this.isPassed(matcher, options.key)

        if (isPassed) {
          this.handle(options, keys[i], ...others)
          break
        }
      }

      return
    }

    const isPassed = this.isPassed(this.matchers, options.key)

    if (!isPassed) {
      return
    }

    await this.handle(options, ...others)
  }

  private isObject(value: any): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !(Array.isArray(value))
  }

  private isPassed(matchers: BaseMatchers, key: string): boolean {
    const tests = Array.isArray(matchers) ? matchers : [matchers]

    return tests.some((test) => {
      if (typeof test === 'string') {
        return test === key
      }

      return test.test(key)
    })
  }
}
