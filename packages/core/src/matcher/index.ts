import type { MaybeArray } from '../types'

interface BaseMatchers<T = string> {
  /**
   * Matcher ID
   */
  id?: T

  /**
   * Matching string or RegExp
   *
   * The key that was used to match the handler
   */
  matching: MaybeArray<string | RegExp>

  /**
   * Description of the handler
   *
   * If multiple handlers are matched, this description will be displayed
   */
  description: string
}

interface ResultMatcher {
  id?: string
  description: string
}

type TypeMatchers = Record<string, BaseMatchers>

type ResultFunction<T> = (matcher: ResultMatcher, ...others: string[]) => T

export type Matchers = MaybeArray<BaseMatchers> | TypeMatchers

class InitxMatcher<T> {
  private resultFunction: ResultFunction<T>

  constructor(fn: ResultFunction<T>) {
    this.resultFunction = fn
  }

  public match(matchers: Matchers, key: string, ...others: string[]): T[] {
    // BaseMatchers
    if (this.isBaseMatchers(matchers)) {
      return this.matchBaseMatchers(matchers, key, ...others)
    }

    // Array<BaseMatchers>
    if (this.isArrayBaseMatchers(matchers)) {
      return this.matchArrayBaseMatchers(matchers, key, ...others)
    }

    // TypeMatchers
    if (this.isObject(matchers)) {
      return this.matchTypeMatchers(matchers, key, ...others)
    }

    return []
  }

  // BaseMatchers
  private matchBaseMatchers(matchers: BaseMatchers, key: string, ...others: string[]): T[] {
    if (!this.isPassed(matchers.matching, key)) {
      return []
    }

    return this.alwaysArray(
      this.buildResultFunction(matchers, ...others)
    )
  }

  private matchArrayBaseMatchers(matchers: BaseMatchers[], key: string, ...others: string[]): T[] {
    const handlers: T[] = []

    for (let i = 0; i < matchers.length; i++) {
      const matcher = matchers[i]
      const isPassed = this.isPassed(matcher.matching, key)

      if (isPassed) {
        handlers.push(
          this.buildResultFunction(matcher, ...others)
        )
      }
    }

    return handlers
  }

  private matchTypeMatchers(matchers: TypeMatchers, key: string, ...others: string[]): T[] {
    const handlers: T[] = []
    const keys = Object.keys(matchers)

    for (let i = 0; i < keys.length; i++) {
      const matcher = matchers[keys[i]]
      const isPassed = this.isPassed(matcher.matching, key)

      if (isPassed) {
        handlers.push(
          this.buildResultFunction(matcher, keys[i], ...others)
        )
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

  private alwaysArray<T>(value: T | T[]): T[] {
    return Array.isArray(value) ? value : [value]
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

  private buildResultMatcher(matcher: BaseMatchers): ResultMatcher {
    return {
      id: matcher.id,
      description: matcher.description
    }
  }

  private buildResultFunction(matcher: BaseMatchers, ...others: string[]): T {
    const buildedMatcher = this.buildResultMatcher(matcher)
    return this.resultFunction(
      buildedMatcher,
      ...others
    )
  }
}

export function useInitxMatcher<T>(fn: ResultFunction<T>) {
  return new InitxMatcher<T>(fn)
}
