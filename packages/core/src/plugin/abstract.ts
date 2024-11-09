import type { PackageInfo } from './utils'

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

export interface InitxCtx {
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
   * Package info
   */
  packageInfo: PackageInfo

  /**
   * Options list
   *
   * cli options list, like
   * @example ['--global']
   */
  optionsList: string[]
}

export abstract class InitxPlugin {
  abstract matchers: Matchers
  abstract handle(options: InitxCtx, ...others: string[]): MaybePromise<void>

  public run(options: InitxCtx, ...others: string[]): HandlerInfo[] {
    // BaseMatchers
    if (this.isBaseMatchers(this.matchers)) {
      return this.matchBaseMatchers(this.matchers, options, ...others)
    }

    // Array<BaseMatchers>
    if (this.isArrayBaseMatchers(this.matchers)) {
      return this.matchArrayBaseMatchers(this.matchers, options, ...others)
    }

    // TypeMatchers
    if (this.isObject(this.matchers)) {
      return this.matchTypeMatchers(this.matchers, options, ...others)
    }

    return []
  }

  // BaseMatchers
  private matchBaseMatchers(matchers: BaseMatchers, options: InitxCtx, ...others: string[]): HandlerInfo[] {
    if (!this.isPassed(matchers.matching, options.key)) {
      return []
    }

    return [
      {
        handler: () => this.handle(options, ...others),
        description: matchers.description
      }
    ]
  }

  private matchArrayBaseMatchers(matchers: BaseMatchers[], options: InitxCtx, ...others: string[]): HandlerInfo[] {
    const handlers: HandlerInfo[] = []

    for (let i = 0; i < matchers.length; i++) {
      const matcher = matchers[i]
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

  private matchTypeMatchers(matchers: TypeMatchers, options: InitxCtx, ...others: string[]): HandlerInfo[] {
    const handlers: HandlerInfo[] = []
    const keys = Object.keys(matchers)

    for (let i = 0; i < keys.length; i++) {
      const matcher = matchers[keys[i]]
      const isPassed = this.isPassed(matcher.matching, options.key)

      if (isPassed) {
        handlers.push({
          handler: () => this.handle(options, keys[i], ...others),
          description: matcher.description
        })
      }
    }

    return handlers
  }

  private isBaseMatchers(matchers: Matchers): matchers is BaseMatchers {
    const keys = Object.keys(matchers)

    return (
      this.isObject(matchers)
      && keys.length === 2
      && keys.every(key => key === 'matching' || key === 'description')
    )
  }

  private isArrayBaseMatchers(matchers: Matchers): matchers is BaseMatchers[] {
    return Array.isArray(matchers) && matchers.every(this.isBaseMatchers.bind(this))
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
