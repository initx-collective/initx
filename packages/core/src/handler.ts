type MaybeArray<T> = T | T[]
type MaybePromise<T> = T | Promise<T>

interface BaseMatchers {
  matching: MaybeArray<string | RegExp>

  /**
   * Description of the handler
   *
   * If multiple handlers are matched, this description will be displayed
   */
  description: string
}
type TypeMatchers = Record<string, BaseMatchers>

type Matchers = MaybeArray<BaseMatchers> | TypeMatchers

export interface HandlerInfo {
  handler: () => MaybePromise<void>
  description: string
}

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

  public run(options: InitxOptions, ...others: string[]): HandlerInfo[] {
    const handlers: HandlerInfo[] = []

    // BaseMatchers
    if (
      !Array.isArray(this.matchers)
      && this.matchers.matching
      && this.matchers.description
      && this.isPassed((this.matchers as BaseMatchers).matching, options.key)
    ) {
      handlers.push({
        handler: () => this.handle(options, ...others),
        description: (this.matchers as BaseMatchers).description
      })

      return handlers
    }

    // TypeMatchers
    if (this.isObject(this.matchers)) {
      const keys = Object.keys(this.matchers)

      for (let i = 0; i < keys.length; i++) {
        const matcher = this.matchers[keys[i]]
        const isPassed = this.isPassed(matcher.matching, options.key)

        if (isPassed) {
          handlers.push({
            handler: () => this.handle(options, keys[i], ...others),
            description: matcher.description
          })

          break
        }
      }

      return handlers
    }

    // Array<BaseMatchers>
    for (let i = 0; i < (this.matchers as Array<BaseMatchers>).length; i++) {
      const matcher = (this.matchers as Array<BaseMatchers>)[i]
      const isPassed = this.isPassed(matcher.matching, options.key)

      if (isPassed) {
        handlers.push({
          handler: () => this.handle(options, ...others),
          description: matcher.description
        })
      }
    }

    return handlers
  }

  private isObject(value: any): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !(Array.isArray(value))
  }

  private isPassed(matchers: BaseMatchers['matching'], key: string): boolean {
    const tests = Array.isArray(matchers) ? matchers : [matchers]

    return tests.some((test) => {
      if (typeof test === 'string') {
        return test === key
      }

      return test.test(key)
    })
  }
}
