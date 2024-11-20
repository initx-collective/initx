import type { MaybeArray } from '../types'

interface MatcherCommon {
  /**
   * Description of the handler
   *
   * If multiple handlers are matched, this description will be displayed
   */
  description: string
}

interface MatcherSetup {
  /**
   * Matching string or RegExp
   *
   * The key that was used to match the handler
   */
  matching: MaybeArray<string | RegExp>
}

export type Matcher<TMatcher> = TMatcher & MatcherCommon

type ResultFunction<TResult, TMatcher> = (matcher: Matcher<TMatcher>, ...others: string[]) => TResult & TMatcher

type BaseMatchers<TMatcher> = Matcher<TMatcher> & MatcherSetup

type TypeMatchers<TMatcher> = Record<string, BaseMatchers<TMatcher>>

export type MatcherOthersDefault = Record<any, any>
export type MatcherOthers<T extends MatcherOthersDefault = MatcherOthersDefault> = T

export type Matchers<TMatcher extends MatcherOthers = MatcherOthers> = MaybeArray<BaseMatchers<TMatcher>> | TypeMatchers<TMatcher>

class InitxMatcher<TResult, TMatcher extends Matcher<MatcherOthers>> {
  private resultFunction: ResultFunction<TResult, TMatcher>

  constructor(fn: ResultFunction<TResult, TMatcher>) {
    this.resultFunction = fn
  }

  public match(matchers: Matchers, key: string, ...others: string[]): (TResult & TMatcher)[] {
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
  private matchBaseMatchers(matchers: BaseMatchers<TMatcher>, key: string, ...others: string[]) {
    if (!this.isPassed(matchers.matching, key)) {
      return []
    }

    return this.alwaysArray(
      this.buildResultFunction(matchers, ...others)
    )
  }

  private matchArrayBaseMatchers(matchers: BaseMatchers<TMatcher>[], key: string, ...others: string[]) {
    const handlers: (TResult & TMatcher)[] = []

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

  private matchTypeMatchers(matchers: TypeMatchers<TMatcher>, key: string, ...others: string[]) {
    const handlers: (TResult & TMatcher)[] = []
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

  private isBaseMatchers(matchers: Matchers<TMatcher>): matchers is BaseMatchers<TMatcher> {
    const keys = Object.keys(matchers)

    const requiredKeys = ['matching', 'description']

    return (
      this.isObject(matchers)
      && keys.length >= 2
      && requiredKeys.every(key => keys.includes(key))
    )
  }

  private isArrayBaseMatchers(matchers: Matchers<TMatcher>): matchers is BaseMatchers<TMatcher>[] {
    return Array.isArray(matchers) && matchers.every(this.isBaseMatchers.bind(this))
  }

  private alwaysArray<T>(value: T | T[]): T[] {
    return Array.isArray(value) ? value : [value]
  }

  private isObject(value: any): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !(Array.isArray(value))
  }

  private isPassed(matchers: MatcherSetup['matching'], key: string): boolean {
    const tests = Array.isArray(matchers) ? matchers : [matchers]

    return tests.some((test) => {
      if (typeof test === 'string') {
        return test === key
      }

      return test.test(key)
    })
  }

  private omit<T>(obj: Record<string, unknown>, keys: string[]) {
    const result: Record<string, unknown> = {}

    for (const key in obj) {
      if (!keys.includes(key)) {
        result[key] = obj[key]
      }
    }

    return result as T
  }

  private buildResultMatcher(matcher: BaseMatchers<TMatcher>) {
    return this.omit<TMatcher & MatcherCommon>(matcher, ['matching'])
  }

  private buildResultFunction(matcher: BaseMatchers<TMatcher>, ...others: string[]): (TResult & TMatcher) {
    const buildedMatcher = this.buildResultMatcher(matcher)
    return this.resultFunction(
      buildedMatcher,
      ...others
    )
  }
}

export function useInitxMatcher<
  TResult,
  TMatcher extends Matcher<MatcherOthers> = Matcher<MatcherOthers>
>(fn: ResultFunction<TResult, TMatcher>) {
  return new InitxMatcher<TResult, TMatcher>(fn)
}
