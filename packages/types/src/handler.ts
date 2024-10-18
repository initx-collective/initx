type MaybeArray<T> = T | T[]
type MaybePromise<T> = T | Promise<T>

type BaseMatchers = MaybeArray<string | RegExp>
type TypeMatchers = Record<string, BaseMatchers>

type Matchers = BaseMatchers | TypeMatchers

export abstract class InitxHandler {
  abstract matchers: Matchers

  abstract handle(value: string, ...others: string[]): MaybePromise<void>
  abstract handle<T>(value: string, type: T, ...others: string[]): MaybePromise<void>

  public async run(value: string, ...others: string[]): Promise<void> {
    if (this.isObject(this.matchers)) {
      const keys = Object.keys(this.matchers)

      for (let i = 0; i < keys.length; i++) {
        const matcher = this.matchers[keys[i]]
        const isPassed = this.isPassed(matcher, value)

        if (isPassed) {
          this.handle(value, keys[i], ...others)
          break
        }
      }

      return
    }

    const isPassed = this.isPassed(this.matchers as BaseMatchers, value)

    if (!isPassed) {
      return
    }

    await this.handle(value, ...others)
  }

  private isObject(value: any): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !(Array.isArray(value))
  }

  private isPassed(matchers: BaseMatchers, value: string): boolean {
    const tests = Array.isArray(matchers) ? matchers : [matchers]

    return tests.some((test) => {
      if (typeof test === 'string') {
        return test === value
      }

      return test.test(value)
    })
  }
}
